import { NextResponse } from "next/server";
import { getSecureOrderDetails } from "@/lib/services/payments";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const result = await getSecureOrderDetails(orderNumber, token);

    if (result.error || !result.order) {
      return NextResponse.json({ error: result.error || "Order not found" }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      order: {
        order_number: result.order.order_number,
        status: result.order.status,
        payment_status: result.order.payment_status,
        currency: result.order.currency,
        subtotal: result.order.subtotal,
        discount_amount: result.order.discount_amount,
        shipping_fee: result.order.shipping_fee,
        total_amount: result.order.total_amount,
        shipping_address: result.order.shipping_address,
        payment_provider: result.order.payment_provider,
        payment_reference: result.order.payment_reference,
        created_at: result.order.created_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (result.order as any).items || [],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching order status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
