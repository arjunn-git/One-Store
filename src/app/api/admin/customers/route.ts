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
      // Offline / dev mock data
      const demoCustomers = [
        {
          id: "cust_demo_01",
          auth_user_id: "auth_usr_in_01",
          email: "arjun.demo@example.com",
          full_name: "Arjun Taneja",
          phone_number: "+91 9876543210",
          phone_verified: true,
          role: "customer",
          apartment_unit: "Flat 402, Signature Towers",
          street_address: "Golf Course Road, Sector 54",
          city: "Gurugram",
          state_or_province: "Haryana",
          postal_code: "122002",
          delivery_instructions: "Leave with security reception",
          is_profile_complete: true,
          profile_completion_percentage: 100,
          created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
          orders_count: 2,
          total_spent_inr: 45998,
          total_spent_gbp: 0,
        },
        {
          id: "cust_demo_02",
          auth_user_id: "auth_usr_gb_02",
          email: "sophia.watson@example.co.uk",
          full_name: "Sophia Watson",
          phone_number: "+44 7911 123456",
          phone_verified: true,
          role: "customer",
          apartment_unit: "Flat 12B",
          street_address: "24 Kensington Church Street",
          city: "London",
          state_or_province: "Greater London",
          postal_code: "W8 4EP",
          delivery_instructions: "Ring bell twice",
          is_profile_complete: true,
          profile_completion_percentage: 100,
          created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          orders_count: 1,
          total_spent_inr: 0,
          total_spent_gbp: 389.0,
        },
      ];
      return NextResponse.json({ success: true, customers: demoCustomers, total: demoCustomers.length });
    }

    const adminDb = createAdminClient();

    // 1. Fetch customer profiles with their saved addresses
    const { data: profiles, error } = await adminDb
      .from("customer_profiles")
      .select("*, addresses(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
