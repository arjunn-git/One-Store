import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { recordActivity } from "@/lib/services/activity";
import { getOrderRecord, getAllStoredOrders } from "@/lib/services/payments";
import type { ActivityEventType } from "@/lib/types/database";

// GET /api/admin/orders/[id] — View single order
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await context.params;

    const storedOrder = getOrderRecord(id) || getAllStoredOrders().find((o) => o.id === id || o.order_number === id);
    if (storedOrder) {
      return NextResponse.json({ success: true, order: storedOrder });
    }

    if (!isLiveSupabaseConfigured()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, customer:customer_profiles(*), items:order_items(*)")
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/orders/[id] — Update order status, tracking, or notes
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { id } = await context.params;
    const body = await request.json();
    const { status, payment_status, tracking_number, carrier_name } = body;

    if (!isLiveSupabaseConfigured()) {
      return NextResponse.json({ success: true, id, status, note: "Updated in sandbox mode" });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status) updatePayload.status = status;
    if (payment_status) updatePayload.payment_status = payment_status;

    // If tracking info provided, update shipping metadata
    if (tracking_number || carrier_name) {
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("shipping_address")
        .eq("id", id)
        .single();

      const existingAddress = (currentOrder?.shipping_address as Record<string, unknown>) || {};
      updatePayload.shipping_address = {
        ...existingAddress,
        tracking_number: tracking_number || existingAddress.tracking_number,
        carrier_name: carrier_name || existingAddress.carrier_name,
      };
    }

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (updatedOrder) {
      let eventType: ActivityEventType = "ORDER_STATUS_CHANGED";
      let actionText = `Order ${updatedOrder.order_number} status updated to ${status || updatedOrder.status}`;

      if (status === "shipped" || status === "delivered") {
        eventType = "ORDER_FULFILLED";
        actionText = `Order ${updatedOrder.order_number} fulfilled (${status})`;
      } else if (status === "cancelled") {
        eventType = "ORDER_CANCELLED";
        actionText = `Order ${updatedOrder.order_number} cancelled`;
      } else if (payment_status === "refunded") {
        eventType = "ORDER_REFUNDED";
        actionText = `Order ${updatedOrder.order_number} refunded`;
      }

      const isUK = updatedOrder.order_number?.includes("-GB-");
      await recordActivity({
        type: eventType,
        action: actionText,
        actor: `Admin (${authResult.email || "Portal"})`,
        market: isUK ? "GB" : "IN",
        currency: isUK ? "GBP" : "INR",
        resourceType: "orders",
        resourceId: updatedOrder.order_number || id,
        details: {
          orderId: id,
          orderNumber: updatedOrder.order_number,
          newStatus: status || updatedOrder.status,
          paymentStatus: payment_status || updatedOrder.payment_status,
          carrier: carrier_name,
          trackingNumber: tracking_number,
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating order";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
