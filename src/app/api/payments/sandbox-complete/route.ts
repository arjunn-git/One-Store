import { NextResponse } from "next/server";
import { markOrderPaymentStatus } from "@/lib/services/payments";

// POST /api/payments/sandbox-complete — Explicit developer test sandbox completion
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, accessToken } = body;

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required" }, { status: 400 });
    }

    // Only allow when live keys are unconfigured or in test mode
    const hasLiveKeys =
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_SECRET.includes("placeholder");

    if (hasLiveKeys && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Sandbox completion is disabled in live production mode." },
        { status: 403 }
      );
    }

    await markOrderPaymentStatus(orderNumber, "succeeded", {
      testMode: true,
      verifiedVia: "developer_sandbox_manual_trigger",
      paymentId: `pay_sandbox_${Date.now()}`,
      verifiedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      accessToken,
      isTestMode: true,
      paymentStatus: "succeeded",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error completing sandbox payment";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
