import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      // In development / sandbox before credentials are provided
      return NextResponse.json({
        received: true,
        note: "Webhook received in sandbox mode (secret not yet configured)",
      });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle successful payment
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload.payment.entity;
      const orderNumber = paymentEntity.notes?.order_number;

      if (orderNumber) {
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({
            payment_status: "succeeded",
            status: "paid",
            payment_reference: paymentEntity.id,
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", orderNumber);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Razorpay webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
