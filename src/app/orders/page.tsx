import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { OrderTrackerClient, TrackedOrder } from "@/components/orders/OrderTrackerClient";
import Link from "next/link";
import { Package } from "lucide-react";

export default async function OrdersPage() {
  let orders: TrackedOrder[] = [];

  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) {
          orders = data;
        }
      }
    } catch {
      orders = [];
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="border-b border-[#243447] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-semibold uppercase tracking-wider">
                <Package className="h-3.5 w-3.5" />
                <span>Dual-Market Order Tracking</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Order History &amp; Status
              </h1>
            </div>

            <Link
              href="/account"
              className="text-xs text-[#9CAFC3] hover:text-[#FFFFFF] flex items-center gap-1.5 transition-colors"
            >
              ← Back to Account
            </Link>
          </div>

          {/* Interactive Order Tracker & History */}
          <OrderTrackerClient initialOrders={orders} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
