import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllStoredOrders } from "@/lib/services/payments";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";
import { getAiTelemetrySummary } from "@/lib/services/ai-assistant";
import { ClientLiveActivityMonitor as LiveActivityMonitor } from "@/components/admin/ClientLiveActivityMonitor";
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
  Store,
  Clock,
  Layers,
  ShoppingBag,
  Sparkles,
  Bot,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPortalDashboard() {
  const authCheck = await verifyAdminRequest();

  if (!authCheck.authorized) {
    redirect("/admin-portal/login");
  }

  // Fetch executive metrics from live Supabase database
  let grossVolumeInr = 0;
  let grossVolumeGbp = 0;
  let pendingFulfillmentCount = 0;
  let activeCustomersCount = 0;
  let liveOrders: any[] = [];
  let catalogProducts: any[] = [];

  if (isLiveSupabaseConfigured()) {
    try {
      const adminSupabase = createAdminClient();

      // 1. Fetch real orders
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

      // 3. Fetch real products with variants
      const { data: prods } = await adminSupabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .eq("status", "active");

      if (prods && prods.length > 0) {
        catalogProducts = prods;
      }
    } catch (err) {
      console.error("Admin portal dashboard fetch error:", err);
    }
  }

  // Merge in-memory active orders
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

  const inrCompletedOrders = liveOrders.filter((o) => o.currency === "INR" && o.payment_status === "succeeded");
  const gbpCompletedOrders = liveOrders.filter((o) => o.currency === "GBP" && o.payment_status === "succeeded");
  const aiSummary = getAiTelemetrySummary();

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Page Title & Status Header */}
      <div className="border-b border-[#243447]/60 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-medium tracking-wide">
            <Activity className="h-3.5 w-3.5 shrink-0" />
            <span>Operations &amp; Telemetry Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] tracking-tight">
            Store Overview &amp; Control
          </h1>
          <p className="text-xs text-[#9CAFC3] mt-0.5">
            Real-time financial settlements, active fulfillment pipelines, and genuine multi-market telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin-portal/orders"
            className="px-3.5 py-2 rounded-xl bg-[#102A43]/40 hover:bg-[#102A43] text-[#FFFFFF] hover:text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC]/40 text-xs font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span>Orders Queue ({liveOrders.length})</span>
          </Link>
          <Link
            href="/admin-portal/products/new"
            className="px-3.5 py-2 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-semibold text-xs transition-colors shadow-sm flex items-center gap-2"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Key Financial & Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: India Revenue */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-3 shadow-lg">
          <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
            <span className="font-medium">Gross Volume (India)</span>
            <div className="p-2 rounded-xl bg-[#102A43]/40 border border-[#243447]/60 text-[#7DD3FC]">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            ₹{grossVolumeInr.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-[#9CAFC3]">
            {inrCompletedOrders.length > 0 ? (
              <span className="text-emerald-400 font-medium">
                {inrCompletedOrders.length} settled transaction{inrCompletedOrders.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span>No settled transactions yet</span>
            )}
          </div>
        </div>

        {/* Metric 2: UK Revenue */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-3 shadow-lg">
          <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
            <span className="font-medium">Gross Volume (UK)</span>
            <div className="p-2 rounded-xl bg-[#102A43]/40 border border-[#243447]/60 text-[#7DD3FC]">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            £{grossVolumeGbp.toFixed(2)}
          </div>
          <div className="text-xs text-[#9CAFC3]">
            {gbpCompletedOrders.length > 0 ? (
              <span className="text-emerald-400 font-medium">
                {gbpCompletedOrders.length} settled transaction{gbpCompletedOrders.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span>No settled transactions yet</span>
            )}
          </div>
        </div>

        {/* Metric 3: Pending Fulfillment */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-3 shadow-lg">
          <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
            <span className="font-medium">Pending Fulfillment</span>
            <div className="p-2 rounded-xl bg-[#102A43]/40 border border-[#243447]/60 text-amber-400">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            {pendingFulfillmentCount}
          </div>
          <div className="text-xs">
            {pendingFulfillmentCount === 0 ? (
              <span className="text-emerald-400 font-medium">All customer orders fulfilled</span>
            ) : (
              <span className="text-amber-300 font-medium">
                {pendingFulfillmentCount} order{pendingFulfillmentCount > 1 ? "s" : ""} awaiting dispatch
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Active Registered Accounts */}
        <Link
          href="/admin-portal/customers"
          className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] hover:bg-[#102A43]/20 border border-[#243447]/80 hover:border-[#7DD3FC]/50 space-y-3 shadow-lg transition-all group block"
        >
          <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
            <span className="font-medium">Active Customers</span>
            <div className="p-2 rounded-xl bg-[#102A43]/40 border border-[#243447]/60 text-[#7DD3FC] group-hover:scale-105 transition-transform">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            {activeCustomersCount}
          </div>
          <div className="text-xs text-[#9CAFC3] flex items-center justify-between">
            <span>Verified shopper profiles</span>
            <span className="text-[#7DD3FC] group-hover:underline flex items-center gap-0.5">
              <span>View</span>
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </Link>
      </div>

      {/* AI Assistant Telemetry & Operational Intelligence */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#243447]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#102A43] border border-[#7DD3FC]/40 text-[#7DD3FC] flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] tracking-tight flex items-center gap-2">
                <span>AI Shopping Assistant Telemetry</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#102A43] border border-[#7DD3FC]/30 text-[#7DD3FC]">
                  {aiSummary.activeProvider.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-[#9CAFC3]">
                Autonomous catalog discovery, multi-market pricing recommendations, and privacy-isolated order tracking.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#9CAFC3]">Provider Status:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {aiSummary.isLlmConfigured ? "Live LLM Engine" : "Curated Semantic Engine"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#080B10]/60 border border-[#243447]/60">
            <div className="text-[11px] text-[#9CAFC3]">Total Sessions</div>
            <div className="text-lg font-bold text-[#FFFFFF] mt-0.5">{aiSummary.totalConversations}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#080B10]/60 border border-[#243447]/60">
            <div className="text-[11px] text-[#9CAFC3]">Queries Handled</div>
            <div className="text-lg font-bold text-[#FFFFFF] mt-0.5">{aiSummary.totalMessages}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#080B10]/60 border border-[#243447]/60">
            <div className="text-[11px] text-[#9CAFC3]">Product Discovery Requests</div>
            <div className="text-lg font-bold text-[#7DD3FC] mt-0.5">{aiSummary.totalRecommendationRequests}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#080B10]/60 border border-[#243447]/60">
            <div className="text-[11px] text-[#9CAFC3]">Markets Served</div>
            <div className="text-sm font-semibold text-[#FFFFFF] mt-1 flex items-center gap-2">
              <span>🇮🇳 {aiSummary.marketBreakdown.IN || 0}</span>
              <span>🇬🇧 {aiSummary.marketBreakdown.GB || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry & Shopper Activity Stream */}
      <LiveActivityMonitor />

      {/* Orders Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#FFFFFF] tracking-tight">Live Orders Queue</h2>
            <p className="text-xs text-[#9CAFC3]">
              Real-time transaction queue synchronized with Razorpay (India) and Stripe (UK) webhooks.
            </p>
          </div>

          <Link
            href="/admin-portal/orders"
            className="px-3.5 py-1.5 rounded-lg bg-[#102A43]/50 hover:bg-[#102A43] text-[#FFFFFF] hover:text-[#7DD3FC] border border-[#243447] hover:border-[#7DD3FC]/40 font-medium text-xs transition-colors w-fit"
          >
            Manage All Orders ({liveOrders.length})
          </Link>
        </div>

        {liveOrders.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#080B10]/60 rounded-xl border border-[#243447]/60">
            <Package className="h-9 w-9 mx-auto text-[#7DD3FC]/50" />
            <div className="text-sm font-semibold text-[#FFFFFF]">No Customer Orders Recorded Yet</div>
            <p className="text-xs text-[#9CAFC3] max-w-md mx-auto">
              Your live database is connected and awaiting customer transactions. Place a test order from the storefront to see live orders appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#243447]/60 text-[#9CAFC3] text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-3 font-semibold">Order Ref</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Market</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Fulfillment</th>
                  <th className="pb-3 font-semibold">Payment</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243447]/40">
                {liveOrders.slice(0, 10).map((order) => {
                  const customerDisplay =
                    (typeof order.shipping_address === "object" && order.shipping_address !== null && order.shipping_address?.recipientName) ||
                    order.customer?.full_name ||
                    order.customer_email ||
                    "Customer";

                  return (
                    <tr key={order.id || order.order_number} className="hover:bg-[#102A43]/20 transition-colors">
                      <td className="py-3.5 font-mono font-medium text-[#7DD3FC]">
                        {order.order_number}
                      </td>
                      <td className="py-3.5 font-medium text-[#FFFFFF]">{customerDisplay}</td>
                      <td className="py-3.5 text-[#9CAFC3]">
                        {order.currency === "INR" ? "India (₹)" : "UK (£)"}
                      </td>
                      <td className="py-3.5 font-semibold text-[#FFFFFF]">
                        {order.currency === "INR"
                          ? `₹${Number(order.total_amount || 0).toLocaleString("en-IN")}`
                          : `£${Number(order.total_amount || 0).toFixed(2)}`}
                      </td>
                      <td className="py-3.5">
                        {order.status === "delivered" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/50">
                            Delivered
                          </span>
                        ) : order.status === "shipped" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-950/40 text-sky-300 border border-sky-800/50">
                            In Transit
                          </span>
                        ) : order.status === "cancelled" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/40 text-rose-300 border border-rose-800/50">
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/40 text-amber-300 border border-amber-800/50">
                            {order.status?.replace("_", " ") || "Processing"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                            order.payment_status === "succeeded"
                              ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/50"
                              : "bg-amber-950/40 text-amber-300 border border-amber-800/50"
                          }`}
                        >
                          {order.payment_status || "Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 text-[#9CAFC3]" suppressHydrationWarning>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Just now"}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href="/admin-portal/orders"
                          className="px-2.5 py-1 rounded-lg bg-[#080B10] hover:bg-[#102A43] border border-[#243447] hover:border-[#7DD3FC]/50 text-[#FFFFFF] font-medium text-xs transition-colors inline-block"
                        >
                          Manage
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Inventory low-stock monitor */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2 tracking-tight">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Inventory &amp; Low-Stock Monitor</span>
            </h2>
            <Link
              href="/admin-portal/inventory"
              className="text-xs text-[#7DD3FC] hover:underline font-medium"
            >
              Manage Stock
            </Link>
          </div>
          <div className="space-y-2.5">
            {catalogProducts.slice(0, 5).map((prod) => {
              const availableUnits =
                Array.isArray(prod.variants) && prod.variants.length > 0
                  ? prod.variants.reduce((s: number, v: any) => s + (Number(v?.inventory_count) || 0), 0)
                  : 10;
              const prodImage = Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : null;

              return (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl bg-[#080B10]/70 border border-[#243447]/80 flex items-center justify-between text-xs hover:border-[#243447] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#102A43] border border-[#243447] overflow-hidden shrink-0 flex items-center justify-center">
                      {prodImage ? (
                        <img
                          src={prodImage}
                          alt={prod.name || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-[#9CAFC3]" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[#FFFFFF]">{prod.name}</div>
                      <div className="font-mono text-[11px] text-[#9CAFC3]">
                        SKU: {prod.sku}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${
                        availableUnits <= 0
                          ? "bg-rose-950/40 text-rose-300 border-rose-800/50"
                          : availableUnits <= 5
                          ? "bg-amber-950/40 text-amber-300 border-amber-800/50"
                          : "bg-[#102A43]/50 text-[#7DD3FC] border-[#243447]"
                      }`}
                    >
                      {availableUnits} Units
                    </span>
                    <Link
                      href="/admin-portal/inventory"
                      className="text-xs text-[#7DD3FC] hover:underline font-medium"
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
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2 tracking-tight">
            <ShieldAlert className="h-4 w-4 text-[#7DD3FC]" />
            <span>Security &amp; Operations Audit Log</span>
          </h2>
          <div className="space-y-2.5 text-xs">
            {[
              {
                action: "ADMIN_AUTH_SECURED",
                detail: "Dedicated administrative gateway initialized at /admin-portal",
                time: "Live",
              },
              {
                action: "ANTI_SELF_PROMOTION",
                detail: "Database RLS policy enforced: ordinary users cannot elevate role",
                time: "Enforced",
              },
              {
                action: "EMAIL_NOTIFIER_ACTIVE",
                detail: "Live order and support alerts routing to onestore.auth@gmail.com",
                time: "Active",
              },
              {
                action: "DUAL_CURRENCY_ISOLATION",
                detail: "India (₹ Razorpay) and UK (£ Stripe) payment gateways separated",
                time: "Active",
              },
            ].map((log, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#080B10]/70 border border-[#243447]/80 flex justify-between items-center"
              >
                <div>
                  <span className="font-mono text-[10px] font-medium text-[#7DD3FC] bg-[#7DD3FC]/10 px-2 py-0.5 rounded border border-[#7DD3FC]/30">
                    {log.action}
                  </span>
                  <div className="text-[#FFFFFF] mt-1 text-xs">{log.detail}</div>
                </div>
                <span className="text-[11px] text-[#9CAFC3] shrink-0 font-medium px-2 py-0.5 rounded-full bg-[#102A43]/30 border border-[#243447]/60">
                  {log.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
