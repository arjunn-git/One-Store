import { NextResponse } from "next/server";
import { processCheckout, type CheckoutPayload } from "@/lib/services/checkout";

export async function POST(request: Request) {
  try {
    const body: CheckoutPayload = await request.json();

    const result = await processCheckout(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error during checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
