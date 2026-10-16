import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { getAllStoredOrders } from "@/lib/services/payments";

// GET /api/admin/orders — Fetch orders with line items and customer details
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase();

    const storedOrders = getAllStoredOrders();
    let orders: any[] = [];

    if (isLiveSupabaseConfigured()) {
      try {
        const adminSupabase = createAdminClient();

        // 1. Try relational query
        let query = adminSupabase
          .from("orders")
          .select("*, items:order_items(*)")
          .order("created_at", { ascending: false });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        if (q) {
          query = query.or(`order_number.ilike.%${q}%`);
        }

        const { data: dbOrders, error: dbOrdersError } = await query;

        if (dbOrders && dbOrders.length > 0) {
          orders = dbOrders;
        } else if (dbOrdersError) {
          // Fallback to simple select without joins
          const { data: simpleOrders } = await adminSupabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
          if (simpleOrders) {
            orders = simpleOrders;
          }
        }
      } catch (dbErr) {
        console.warn("DB orders fetch warning:", dbErr);
      }
    }

    // Merge in any registered in-memory / session orders that aren't yet in the database
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

    // Return only genuine recorded orders (database + live checkout session store)
    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching orders";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
