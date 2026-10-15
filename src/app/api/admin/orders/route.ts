import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";
import { getAllStoredOrders } from "@/lib/services/payments";

// GET /api/admin/orders — Fetch orders with line items and customer details
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase();

    if (!isLiveSupabaseConfigured()) {
      // Demonstration orders stream
      const sampleOrders = [
        {
          id: "ord-001",
          order_number: "OS-2026-IN-9812",
          customer_email: "aarav.sharma@example.com",
          recipient_name: "Aarav Sharma",
          status: "pending_payment",
          payment_status: "pending",
          currency: "INR",
          subtotal: 24999,
          total_amount: 24999,
          shipping_fee: 0,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          items: [
            {
              id: "item-1",
              product_name: "One Acoustic Pro Wireless",
              variant_name: "Obsidian Black",
              sku: "OAP-BLK-001-A",
              unit_price: 24999,
              quantity: 1,
              total_price: 24999,
            },
          ],
        },
        {
          id: "ord-002",
          order_number: "OS-2026-GB-4120",
          customer_email: "oliver.smith@example.co.uk",
          recipient_name: "Oliver Smith",
          status: "processing",
          payment_status: "succeeded",
          currency: "GBP",
          subtotal: 145,
          total_amount: 145,
          shipping_fee: 0,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          items: [
            {
              id: "item-2",
              product_name: "One Apex Modular Daypack 24L",
              variant_name: "Graphite Grey",
              sku: "OAD-GRY-002-A",
              unit_price: 145,
              quantity: 1,
              total_price: 145,
            },
          ],
        },
      ];
      return NextResponse.json({ success: true, orders: sampleOrders, isFallback: true });
    }

    const adminSupabase = createAdminClient();
    const storedOrders = getAllStoredOrders();

    let orders: any[] = [];
    if (isLiveSupabaseConfigured()) {
      let query = adminSupabase
        .from("orders")
        .select("*, customer:customer_profiles(*), items:order_items(*)")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (q) {
        query = query.or(`order_number.ilike.%${q}%`);
      }

      const { data: dbOrders } = await query;
      if (dbOrders) {
        orders = dbOrders;
      }
    }

    // Merge in any registered in-memory orders that aren't yet in the database
    const dbOrderNumbers = new Set(orders.map((o) => o.order_number));
    storedOrders.forEach((so) => {
      if (!dbOrderNumbers.has(so.order_number)) {
        if (!status || status === "all" || so.status === status) {
          if (!q || so.order_number.toLowerCase().includes(q)) {
            orders.unshift(so);
          }
        }
      }
    });

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching orders";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
