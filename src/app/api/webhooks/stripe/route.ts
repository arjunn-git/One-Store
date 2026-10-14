import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      // In development / sandbox before credentials are provided
      return NextResponse.json({
        received: true,
        note: "Webhook received in sandbox mode (secret not yet configured)",
      });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    // Verify Stripe signature header (t=...,v1=...)
    const sigComponents = signature.split(",").reduce<Record<string, string>>((acc, item) => {
      const [key, val] = item.split("=");
      if (key && val) acc[key.trim()] = val.trim();
      return acc;
    }, {});

    const timestamp = sigComponents.t;
    const v1Signature = sigComponents.v1;

    if (!timestamp || !v1Signature) {
      return NextResponse.json({ error: "Malformed stripe-signature header" }, { status: 400 });
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    if (expectedSignature !== v1Signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderNumber = session.client_reference_id || session.metadata?.order_number;

      if (orderNumber) {
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({
            payment_status: "succeeded",
            status: "paid",
            payment_reference: session.payment_intent || session.id,
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", orderNumber);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe webhook error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
