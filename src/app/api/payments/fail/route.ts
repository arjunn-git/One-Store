import { NextResponse } from "next/server";
import { markOrderPaymentStatus } from "@/lib/services/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, reason, paymentId } = body;

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    await markOrderPaymentStatus(orderNumber, "failed", {
      reason: reason || "Payment modal dismissed or aborted by customer",
      paymentId: paymentId || null,
      failedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, orderNumber, paymentStatus: "failed" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error recording payment failure";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
