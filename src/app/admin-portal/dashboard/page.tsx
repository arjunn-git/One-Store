import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllStoredOrders } from "@/lib/services/payments";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";
import { LiveActivityMonitor } from "@/components/admin/LiveActivityMonitor";
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
} from "lucide-react";

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

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title & Status Header */}
      <div className="border-b border-[#243447] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-semibold uppercase tracking-wider">
            <Activity className="h-3.5 w-3.5" />
            <span>Executive Operations Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
            Administrative Portal
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin-portal/orders"
            className="px-3.5 py-2 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#7DD3FC] border border-[#243447] text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Orders Queue ({liveOrders.length})</span>
          </Link>
          <Link
            href="/admin-portal/products/new"
            className="px-3.5 py-2 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-md shadow-[#7DD3FC]/10 flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Key Financial & Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: India Revenue */}
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl backdrop-blur-sm">
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
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl backdrop-blur-sm">
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
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl backdrop-blur-sm">
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
        <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-2 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center text-xs text-[#9CAFC3]">
            <span>Active Customers</span>
            <Users className="h-4 w-4 text-[#7DD3FC]" />
          </div>
          <div className="text-2xl font-black text-[#FFFFFF]">{activeCustomersCount}</div>
          <div className="text-[11px] text-[#7DD3FC]">Dual-market customer accounts</div>
        </div>
      </div>

      {/* Real-time Telemetry & Shopper Activity Stream */}
      <LiveActivityMonitor />

      {/* Orders Table */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#FFFFFF]">Live Orders Queue</h2>
            <p className="text-xs text-[#9CAFC3]">
              Real-time transaction queue synced with Razorpay and Stripe payment webhooks.
            </p>
          </div>

          <Link
            href="/admin-portal/orders"
            className="px-3.5 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#7DD3FC] border border-[#243447] font-semibold text-xs transition-all w-fit"
          >
            Manage All Orders ({liveOrders.length})
          </Link>
        </div>

        {liveOrders.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#080B10]/60 rounded-xl border border-[#243447]/60">
            <Package className="h-10 w-10 mx-auto text-[#7DD3FC]/60" />
            <div className="text-sm font-bold text-[#FFFFFF]">No Customer Orders Recorded Yet</div>
            <p className="text-xs text-[#9CAFC3] max-w-md mx-auto">
              Your live database is connected and awaiting customer transactions. Place a test order from the storefront to see live orders appear here.
            </p>
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
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
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
                          href="/admin-portal/orders"
                          className="px-3 py-1 rounded bg-[#080B10] hover:bg-[#102A43] border border-[#243447] hover:border-[#7DD3FC] text-[#FFFFFF] font-semibold text-[11px] transition-all inline-block"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory low-stock monitor */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#FFFFFF] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <span>Inventory &amp; Low-Stock Monitor</span>
            </h2>
            <Link
              href="/admin-portal/inventory"
              className="text-xs text-[#7DD3FC] hover:underline font-semibold"
            >
              Manage Stock
            </Link>
          </div>
          <div className="space-y-3">
            {catalogProducts.slice(0, 5).map((prod) => {
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
                      {availableUnits} Units
                    </span>
                    <Link
                      href="/admin-portal/inventory"
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
        <div className="p-6 sm:p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-[#FFFFFF] flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#7DD3FC]" />
            <span>Security &amp; Operations Audit Log</span>
          </h2>
          <div className="space-y-3 text-xs">
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
                className="p-3.5 rounded-xl bg-[#080B10] border border-[#243447] flex justify-between items-center"
              >
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#7DD3FC] bg-[#7DD3FC]/10 px-2 py-0.5 rounded border border-[#7DD3FC]/30">
                    {log.action}
                  </span>
                  <div className="text-[#FFFFFF] mt-1 text-xs">{log.detail}</div>
                </div>
                <span className="text-[11px] text-[#9CAFC3] shrink-0 font-medium">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
