import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdminNav } from "@/components/admin/AdminNav";
import { LiveActivityMonitor } from "@/components/admin/LiveActivityMonitor";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";
import { getAllStoredOrders } from "@/lib/services/payments";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  DollarSign,
  Activity,
  LogOut,
  Store,
} from "lucide-react";

import { cookies } from "next/headers";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const demoEmail = cookieStore.get("one_store_user_email")?.value;

  let user = null;
  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      user = null;
    }
  }

  const activeEmail = user?.email || demoEmail;
  let isAdmin = isAdminEmail(activeEmail);

  if (user && !isAdmin && isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "owner") {
        isAdmin = true;
      }
    } catch {
      // Ignored
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-[#080B10]">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md w-full p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] text-center space-y-6 shadow-2xl backdrop-blur-sm">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#FFFFFF]">Restricted Access Area</h1>
              <p className="text-xs text-[#9CAFC3] mt-2">
                This operations portal requires System Administrator privileges. Only designated administrative accounts can view financial data, inventory controls, and order dispatch workflows.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/login?next=/admin"
                className="w-full py-3 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-lg shadow-[#7DD3FC]/10"
              >
                Sign In as Administrator
              </Link>
              <Link
                href="/"
                className="w-full py-2.5 rounded-xl bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC] text-[#9CAFC3] hover:text-[#FFFFFF] text-xs font-semibold transition-all"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Query live production database for executive metrics
  let grossVolumeInr = 0;
  let grossVolumeGbp = 0;
  let pendingFulfillmentCount = 0;
  let activeCustomersCount = 0;
  let liveOrders: any[] = [];
  let catalogProducts: any[] = [];

  if (isLiveSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();

      // 1. Fetch real orders with line items and customer profile
      const { data: ordersData } = await adminSupabase
        .from("orders")
        .select("*, customer:customer_profiles(*), items:order_items(*)")
        .order("created_at", { ascending: false });

      if (ordersData && ordersData.length > 0) {
        liveOrders = ordersData;
        ordersData.forEach((ord: any) => {
          if (ord.payment_status === "succeeded") {
            if (ord.currency === "INR") {
              grossVolumeInr += Number(ord.total_amount) || 0;
            } else {
              grossVolumeGbp += Number(ord.total_amount) || 0;
            }
          }
          if (
            ord.status === "processing" ||
            ord.status === "pending_payment" ||
            (ord.payment_status === "succeeded" && ord.status !== "delivered" && ord.status !== "cancelled")
          ) {
            pendingFulfillmentCount++;
          }
        });
      }

      // 2. Fetch real active registered customer accounts
      const { count: customerCount } = await adminSupabase
        .from("customer_profiles")
        .select("*", { count: "exact", head: true });
      activeCustomersCount = customerCount || 0;

      // 3. Fetch real products with variants for inventory monitor
      const { data: prods } = await adminSupabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .eq("status", "active");

      if (prods && prods.length > 0) {
        catalogProducts = prods;
      }
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    }
  }

  // Merge any orders registered in active memory store
  const storedOrders = getAllStoredOrders();
  const dbOrderNumbers = new Set(liveOrders.map((o) => o.order_number));
  storedOrders.forEach((so) => {
    if (!dbOrderNumbers.has(so.order_number)) {
      liveOrders.unshift(so);
      if (so.payment_status === "succeeded") {
        if (so.currency === "INR") {
          grossVolumeInr += Number(so.total_amount) || 0;
        } else {
          grossVolumeGbp += Number(so.total_amount) || 0;
        }
      }
      if (
        so.status === "processing" ||
        so.status === "pending_payment" ||
        (so.payment_status === "succeeded" && so.status !== "delivered" && so.status !== "cancelled")
      ) {
        pendingFulfillmentCount++;
      }
    }
  });

  if (catalogProducts.length === 0) {
    catalogProducts = FALLBACK_PRODUCTS;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />
      <AdminNav />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header */}
          <div className="border-b border-[#243447] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-semibold uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5" />
                <span>One Store Operations Command</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Executive Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs px-3 py-1.5 rounded-full bg-[#102A43] border border-[#243447] text-[#7DD3FC] font-semibold">
                Role: Operations Admin
              </span>
              <Link
                href="/"
                className="px-3 py-1.5 rounded-xl bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC] text-[#FFFFFF] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Store className="h-3.5 w-3.5 text-[#7DD3FC]" />
                <span>View Storefront</span>
              </Link>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-red-950/50 border border-red-800/80 hover:bg-red-900/60 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1: India Revenue */}
            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl">
              <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
                <span>Gross Volume (India)</span>
                <TrendingUp className="h-4 w-4 text-[#7DD3FC]" />
              </div>
              <div className="text-2xl font-black text-[#FFFFFF]">
                ₹{grossVolumeInr.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-emerald-400">
                {liveOrders.filter((o) => o.currency === "INR" && o.payment_status === "succeeded").length} completed order(s)
              </div>
            </div>

            {/* Metric 2: UK Revenue */}
            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl">
              <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
                <span>Gross Volume (UK)</span>
                <DollarSign className="h-4 w-4 text-[#7DD3FC]" />
              </div>
              <div className="text-2xl font-black text-[#FFFFFF]">
                £{grossVolumeGbp.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-400">
                {liveOrders.filter((o) => o.currency === "GBP" && o.payment_status === "succeeded").length} completed order(s)
              </div>
            </div>

            {/* Metric 3: Pending Fulfillment */}
            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl">
              <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
                <span>Pending Fulfillment</span>
                <Package className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-[#FFFFFF]">{pendingFulfillmentCount}</div>
              <div className="text-[11px] text-amber-300">
                {pendingFulfillmentCount === 0 ? "All orders dispatched" : "Requires dispatch label generation"}
              </div>
            </div>

            {/* Metric 4: Active Registered Accounts */}
            <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl">
              <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
                <span>Active Customers</span>
                <Users className="h-4 w-4 text-[#7DD3FC]" />
              </div>
              <div className="text-2xl font-black text-[#FFFFFF]">{activeCustomersCount}</div>
              <div className="text-[11px] text-[#7DD3FC]">Dual-market canonical accounts</div>
            </div>
          </div>

          {/* Real-time Telemetry & Activity Stream */}
          <LiveActivityMonitor />

          {/* Orders Management Table */}
          <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#FFFFFF]">Live Orders Stream</h2>
                <p className="text-xs text-[#9CAFC3]">
                  Real-time transaction queue synced with Razorpay and Stripe payment webhooks.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Link
                  href="/admin/orders"
                  className="px-3.5 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#7DD3FC] border border-[#243447] font-semibold transition-all"
                >
                  Manage All Orders ({liveOrders.length})
                </Link>
              </div>
            </div>

            {liveOrders.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-[#080B10]/60 rounded-xl border border-[#243447]/60">
                <Package className="h-10 w-10 mx-auto text-[#7DD3FC]/60" />
                <div className="text-sm font-bold text-[#FFFFFF]">No Customer Orders Recorded Yet</div>
                <p className="text-xs text-[#9CAFC3] max-w-md mx-auto">
                  Your live Supabase database is connected and awaiting transactions. Place a test checkout order from the storefront to see live orders appear here instantly.
                </p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-md shadow-[#7DD3FC]/10"
                  >
                    <Store className="h-4 w-4" />
                    <span>Place Test Order on Storefront</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#243447] text-[#9CAFC3] uppercase tracking-wider font-semibold">
                      <th className="pb-3">Order Ref</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Market</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Fulfillment</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Time</th>
                      <th className="pb-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243447]/60">
                    {liveOrders.slice(0, 10).map((order) => {
                      const customerDisplay =
                        order.shipping_address?.recipientName ||
                        order.customer?.full_name ||
                        order.customer_email ||
                        "Customer";

                      return (
                        <tr key={order.id || order.order_number} className="hover:bg-[#102A43]/20 transition-colors">
                          <td className="py-4 font-mono font-bold text-[#7DD3FC]">
                            {order.order_number}
                          </td>
                          <td className="py-4 font-semibold text-[#FFFFFF]">{customerDisplay}</td>
                          <td className="py-4 text-[#9CAFC3]">
                            {order.currency === "INR" ? "India (₹)" : "UK (£)"}
                          </td>
                          <td className="py-4 font-bold text-[#FFFFFF]">
                            {order.currency === "INR"
                              ? `₹${Number(order.total_amount).toLocaleString("en-IN")}`
                              : `£${Number(order.total_amount).toFixed(2)}`}
                          </td>
                          <td className="py-4">
                            {order.status === "delivered" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                Delivered
                              </span>
                            ) : order.status === "shipped" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
                                In Transit
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                                {order.status?.replace("_", " ") || "Processing"}
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                order.payment_status === "succeeded"
                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                                  : "bg-amber-950/80 text-amber-300 border border-amber-800"
                              }`}
                            >
                              {order.payment_status || "Pending"}
                            </span>
                          </td>
                          <td className="py-4 text-[#9CAFC3]">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : "Just now"}
                          </td>
                          <td className="py-4 text-right">
                            <Link
                              href="/admin/orders"
                              className="px-3 py-1 rounded bg-[#080B10] hover:bg-[#102A43] border border-[#243447] hover:border-[#7DD3FC] text-[#FFFFFF] font-semibold text-[11px] transition-all inline-block"
                            >
                              Manage Dispatch
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Catalog & Inventory Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inventory adjustments */}
            <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#FFFFFF] flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <span>Inventory &amp; Low-Stock Monitor</span>
                </h2>
                <Link
                  href="/admin/inventory"
                  className="text-xs text-[#7DD3FC] hover:underline font-semibold"
                >
                  Manage Stock
                </Link>
              </div>
              <div className="space-y-3">
                {catalogProducts.map((prod) => {
                  const availableUnits =
                    prod.variants && prod.variants.length > 0
                      ? prod.variants.reduce((s: number, v: any) => s + (v.inventory_count || 0), 0)
                      : 10;

                  return (
                    <div
                      key={prod.id}
                      className="p-4 rounded-xl bg-[#080B10] border border-[#243447] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#102A43] border border-[#243447] overflow-hidden shrink-0 flex items-center justify-center">
                          {prod.images && prod.images[0] ? (
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-[#9CAFC3]" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[#FFFFFF]">{prod.name}</div>
                          <div className="font-mono text-[11px] text-[#9CAFC3] mt-0.5">
                            SKU: {prod.sku}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2.5 py-1 rounded-full border font-mono font-semibold ${
                            availableUnits <= 5
                              ? "bg-red-950/80 text-red-300 border-red-800"
                              : "bg-[#102A43] text-[#7DD3FC] border-[#243447]"
                          }`}
                        >
                          {availableUnits} Units Available
                        </span>
                        <Link
                          href="/admin/inventory"
                          className="text-[11px] text-[#7DD3FC] hover:underline font-semibold"
                        >
                          Adjust
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Logs */}
            <div className="p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
              <h2 className="text-lg font-bold text-[#FFFFFF] flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-[#7DD3FC]" />
                <span>Security &amp; Operations Audit Log</span>
              </h2>
              <div className="space-y-3 text-xs">
                {[
                  {
                    action: "PRICE_UPDATE",
                    detail: "Adjusted UK compare-at price on One Acoustic Pro",
                    time: "2 hours ago",
                  },
                  {
                    action: "DISPATCH_CONFIRMED",
                    detail: "Generated Blue Dart waybill BLUEDART-EXP-992819",
                    time: "5 hours ago",
                  },
                  {
                    action: "PROMO_CREATED",
                    detail: "Issued campaign code LAUNCH10 (10% off)",
                    time: "1 day ago",
                  },
                  {
                    action: "STOCK_RESERVED",
                    detail: "Order OS-2026-IN-4891 reserved 1x Obsidian Black",
                    time: "2 days ago",
                  },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-[#080B10] border border-[#243447] flex justify-between items-center"
                  >
                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#7DD3FC] bg-[#7DD3FC]/10 px-2 py-0.5 rounded border border-[#7DD3FC]/30">
                        {log.action}
                      </span>
                      <div className="text-[#FFFFFF] mt-1 text-xs">{log.detail}</div>
                    </div>
                    <span className="text-[11px] text-[#9CAFC3] shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
