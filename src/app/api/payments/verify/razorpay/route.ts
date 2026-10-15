import { NextResponse } from "next/server";
import { processRazorpayPaymentSuccess } from "@/lib/services/payments";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required payment verification parameters: orderNumber, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.",
        },
        { status: 400 }
      );
    }

    const result = await processRazorpayPaymentSuccess(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Payment verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error verifying payment signature";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
