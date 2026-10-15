import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { markOrderPaymentStatus } from "@/lib/services/payments";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret.includes("placeholder")) {
      return NextResponse.json(
        {
          received: true,
          note: "Webhook received in standby mode (RAZORPAY_WEBHOOK_SECRET not yet configured in production)",
        },
        { status: 200 }
      );
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing x-razorpay-signature header" }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isSignatureValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Invalid cryptographic signature on webhook payload" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured or order.paid
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderNumber =
        paymentEntity?.notes?.order_number ||
        payload.payload?.order?.entity?.notes?.order_number ||
        paymentEntity?.receipt;

      if (orderNumber) {
        const supabase = createAdminClient();

        // Idempotency check: see if order is already marked succeeded
        const { data: existing } = await supabase
          .from("orders")
          .select("payment_status, status")
          .eq("order_number", orderNumber)
          .maybeSingle();

        if (existing?.payment_status === "succeeded") {
          return NextResponse.json({
            received: true,
            idempotent: true,
            note: `Order ${orderNumber} already marked as succeeded`,
          });
        }

        await markOrderPaymentStatus(orderNumber, "succeeded", {
          paymentId: paymentEntity?.id,
          razorpayOrderId: paymentEntity?.order_id,
          webhookEventId: payload.event_id || `evt_${Date.now()}`,
          verifiedVia: "webhook",
          processedAt: new Date().toISOString(),
        });
      }
    }

    // Handle payment.failed
    if (event === "payment.failed") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderNumber = paymentEntity?.notes?.order_number || paymentEntity?.receipt;

      if (orderNumber) {
        await markOrderPaymentStatus(orderNumber, "failed", {
          paymentId: paymentEntity?.id,
          failureReason: paymentEntity?.error_description || "Payment failed via gateway callback",
          webhookEventId: payload.event_id || `evt_${Date.now()}`,
          verifiedVia: "webhook",
          processedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true, event });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Razorpay webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
