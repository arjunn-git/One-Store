import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";
import { getAllStoredOrders } from "@/lib/services/payments";

// GET /api/admin/orders — Fetch orders with line items and customer details
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const demoEmail = cookieStore.get("one_store_user_email")?.value;

    let userEmail = demoEmail || null;
    let isAdmin = isAdminEmail(userEmail);

    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email) {
          userEmail = user.email;
          if (isAdminEmail(user.email)) {
            isAdmin = true;
          }
        }

        if (user && !isAdmin) {
          const { data: profile } = await supabase
            .from("customer_profiles")
            .select("role")
            .eq("auth_user_id", user.id)
            .single();

          if (profile?.role === "admin" || profile?.role === "owner") {
            isAdmin = true;
          }
        }
      } catch {
        // Fall back to cookie auth
      }
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
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

    // If database and memory store have 0 orders yet, provide seed orders for admin inspection
    if (orders.length === 0 && !q && (!status || status === "all")) {
      const sampleOrders = [
        {
          id: "ord-sample-01",
          order_number: "OS-2026-IN-3434",
          customer_email: "aarav.sharma@example.com",
          recipient_name: "Aarav Sharma",
          status: "processing",
          payment_status: "succeeded",
          currency: "INR",
          subtotal: 24999,
          total_amount: 24999,
          shipping_fee: 0,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          shipping_address: {
            recipientName: "Aarav Sharma",
            phone: "+91 98765 43210",
            line1: "B-402 Bandra Kurla Complex",
            city: "Mumbai",
            stateOrProvince: "Maharashtra",
            postalCode: "400051",
            countryCode: "IN",
          },
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
          id: "ord-sample-02",
          order_number: "OS-2026-GB-4355",
          customer_email: "oliver.smith@example.co.uk",
          recipient_name: "Oliver Smith",
          status: "processing",
          payment_status: "succeeded",
          currency: "GBP",
          subtotal: 249,
          total_amount: 249,
          shipping_fee: 0,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          shipping_address: {
            recipientName: "Oliver Smith",
            phone: "+44 7123 456789",
            line1: "10 Downing Street",
            city: "London",
            stateOrProvince: "Greater London",
            postalCode: "SW1A 2AA",
            countryCode: "GB",
          },
          items: [
            {
              id: "item-2",
              product_name: "One Apex Modular Daypack 24L",
              variant_name: "Graphite Grey",
              sku: "OAD-GRY-002-A",
              unit_price: 249,
              quantity: 1,
              total_price: 249,
            },
          ],
        },
      ];
      orders = sampleOrders;
    }

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching orders";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
