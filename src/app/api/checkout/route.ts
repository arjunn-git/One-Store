import { NextResponse } from "next/server";
import { processCheckout, type CheckoutPayload } from "@/lib/services/checkout";
import { recordActivity } from "@/lib/services/activity";

export async function POST(request: Request) {
  try {
    const body: CheckoutPayload = await request.json();

    const result = await processCheckout(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.orderNumber) {
      await recordActivity({
        type: "ORDER_CREATED",
        action: `Order Placed: ${result.orderNumber}`,
        actor: `${body.recipientName || "Customer"} (${body.customerEmail || "Guest"})`,
        market: body.market,
        currency: result.currency,
        resourceType: "orders",
        resourceId: result.orderNumber,
        details: {
          orderNumber: result.orderNumber,
          totalAmount: result.totalAmount,
          currency: result.currency,
          paymentProvider: result.paymentProvider,
          itemsCount: body.items?.length || 1,
          city: body.city,
          country: body.market === "GB" ? "United Kingdom" : "India",
        },
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error during checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
