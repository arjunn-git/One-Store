import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";

export async function GET(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    if (!isLiveSupabaseConfigured()) {
      return NextResponse.json({ success: true, customers: [], total: 0 });
    }

    const adminDb = createAdminClient();

    // 1. Fetch customer profiles with their saved addresses
    const { data: profiles, error } = await adminDb
      .from("customer_profiles")
      .select("*, addresses(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("customer_profiles query failed:", error.message);
      return NextResponse.json({
        success: true,
        customers: [],
        total: 0,
      });
    }

    // 2. Fetch order stats per customer
    const { data: orders } = await adminDb
      .from("orders")
      .select("customer_id, total_amount, currency, status, payment_status");

    const customersWithStats = (profiles || []).map((prof: any) => {
      const customerOrders = (orders || []).filter(
        (o: any) => o.customer_id === prof.id || o.customer_id === prof.auth_user_id
      );

      let spentInr = 0;
      let spentGbp = 0;
      customerOrders.forEach((o: any) => {
        if (o.payment_status === "succeeded") {
          if (o.currency === "INR") spentInr += Number(o.total_amount) || 0;
          else spentGbp += Number(o.total_amount) || 0;
        }
      });

      return {
        ...prof,
        orders_count: customerOrders.length,
        total_spent_inr: spentInr,
        total_spent_gbp: spentGbp,
      };
    });

    return NextResponse.json({
      success: true,
      customers: customersWithStats,
      total: customersWithStats.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching customer records.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
