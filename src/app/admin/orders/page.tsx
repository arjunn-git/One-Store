"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AdminNav } from "@/components/admin/AdminNav";
import { LiveActivityMonitor } from "@/components/admin/LiveActivityMonitor";
import {
  ShoppingBag,
  RefreshCw,
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  X,
  Send,
  ExternalLink,
  Activity,
} from "lucide-react";
import type { OrderStatus, PaymentStatus } from "@/lib/types/database";

interface OrderItem {
  id: string;
  product_name: string;
  variant_name?: string | null;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

interface AdminOrder {
  id: string;
  order_number: string;
  customer_email?: string;
  customer?: {
    email: string;
    full_name?: string;
  } | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  currency: "INR" | "GBP";
  subtotal: number;
  total_amount: number;
  shipping_fee: number;
  discount_amount?: number;
  created_at: string;
  shipping_address?: {
    recipientName?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    stateOrProvince?: string;
    postalCode?: string;
    countryCode?: string;
    tracking_number?: string;
    carrier_name?: string;
  } | null;
  payment_provider?: string;
  items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Inspect Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [carrierName, setCarrierName] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const [isLiveSync, setIsLiveSync] = useState(true);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load orders");
      }

      setOrders(data.orders || []);
    } catch (err: unknown) {
      if (!silent) setError(err instanceof Error ? err.message : "Error fetching orders");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Live auto-polling every 4 seconds to sync newly placed customer orders
  useEffect(() => {
    if (!isLiveSync) return;
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isLiveSync, statusFilter, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const openOrderModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNextStatus(order.status);
    setTrackingNumber(order.shipping_address?.tracking_number || "");
    setCarrierName(order.shipping_address?.carrier_name || "Blue Dart Express");
    setUpdateSuccess(null);
  };

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          tracking_number: trackingNumber,
          carrier_name: carrierName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }

      setUpdateSuccess("Fulfillment status updated successfully.");

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: nextStatus as OrderStatus,
                shipping_address: {
                  ...o.shipping_address,
                  tracking_number: trackingNumber,
                  carrier_name: carrierName,
                },
              }
            : o
        )
      );

      setTimeout(() => {
        setSelectedOrder(null);
        setUpdateSuccess(null);
        fetchOrders();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error updating fulfillment");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />
      <AdminNav />

      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447] pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] font-semibold uppercase tracking-wider mb-1">
                <ShoppingBag className="h-4 w-4" />
                <span>One Store Orders Stream</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Order Fulfillment &amp; Dispatch Portal
              </h1>
              <p className="text-xs text-[#9CAFC3] mt-1">
                Track customer checkout orders, manage dispatch transitions, and view real-time customer activity stream.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLiveSync(!isLiveSync)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isLiveSync
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                    : "bg-[#080B10] border-[#243447] text-[#9CAFC3]"
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {isLiveSync && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isLiveSync ? "bg-emerald-500" : "bg-zinc-600"
                    }`}
                  ></span>
                </span>
                <span>{isLiveSync ? "Live Auto-Sync (4s)" : "Sync Paused"}</span>
              </button>

              <button
                onClick={() => fetchOrders(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#7DD3FC]" : ""}`} />
                <span>Refresh Orders</span>
              </button>
            </div>
          </div>

          {/* Live Telemetry & Activity Stream */}
          <LiveActivityMonitor
            onOrderClick={(orderNum) => {
              setSearch(orderNum);
              const params = new URLSearchParams();
              params.set("q", orderNum);
              fetch(`/api/admin/orders?${params.toString()}`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.orders) setOrders(d.orders);
                })
                .catch(() => {});
            }}
          />

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#102A43]/40 border border-[#243447] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-[#9CAFC3] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by order reference (e.g. OS-2026)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#FFFFFF] border border-[#243447] text-xs font-semibold transition-all"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "pending_payment", "processing", "shipped", "delivered", "cancelled"] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      statusFilter === st
                        ? "bg-[#7DD3FC] text-[#080B10] font-bold shadow-sm"
                        : "bg-[#080B10] text-[#9CAFC3] border border-[#243447] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Orders Table */}
          <div className="rounded-2xl bg-[#102A43]/40 border border-[#243447] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#243447] bg-[#0c141e] text-[#9CAFC3] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Order Ref</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Market</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4">Fulfillment Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#243447]/60">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#9CAFC3]">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#7DD3FC] mb-2" />
                        Loading orders...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[#9CAFC3]">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => {
                      const customerDisplay =
                        ord.shipping_address?.recipientName ||
                        ord.customer?.full_name ||
                        ord.customer_email ||
                        "Guest Checkout";

                      return (
                        <tr key={ord.id} className="hover:bg-[#102A43]/30 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-[#7DD3FC]">
                            {ord.order_number}
                          </td>
                          <td className="py-4 px-4 font-semibold text-[#FFFFFF]">
                            {customerDisplay}
                          </td>
                          <td className="py-4 px-4 text-[#9CAFC3]">
                            {ord.currency === "INR" ? "India (₹)" : "UK (£)"}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-[#FFFFFF]">
                            {ord.currency === "INR" ? `₹${ord.total_amount?.toLocaleString("en-IN")}` : `£${ord.total_amount?.toFixed(2)}`}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ord.payment_status === "succeeded"
                                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                                  : ord.payment_status === "pending"
                                  ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                                  : "bg-red-950/80 text-red-300 border border-red-800"
                              }`}
                            >
                              {ord.payment_status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ord.status === "delivered"
                                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                                  : ord.status === "shipped"
                                  ? "bg-[#102A43] text-[#7DD3FC] border border-[#243447]"
                                  : ord.status === "processing"
                                  ? "bg-blue-950/80 text-blue-300 border border-blue-800"
                                  : ord.status === "cancelled"
                                  ? "bg-red-950/80 text-red-300 border border-red-800"
                                  : "bg-amber-950/80 text-amber-300 border border-amber-800"
                              }`}
                            >
                              {ord.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-[#9CAFC3] text-[11px]">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openOrderModal(ord)}
                              className="px-3 py-1.5 rounded-lg bg-[#080B10] hover:bg-[#7DD3FC] text-[#FFFFFF] hover:text-[#080B10] border border-[#243447] text-xs font-semibold transition-all"
                            >
                              Manage Dispatch
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Order Inspection & Fulfillment Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-2xl w-full p-6 rounded-2xl bg-[#0c141e] border border-[#243447] space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#243447] pb-3">
              <div>
                <h3 className="font-bold text-[#FFFFFF] text-base">Fulfillment Inspection</h3>
                <p className="text-xs font-mono text-[#7DD3FC] mt-0.5">
                  Order {selectedOrder.order_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg hover:bg-[#102A43] text-[#9CAFC3] hover:text-[#FFFFFF]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {updateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{updateSuccess}</span>
              </div>
            )}

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-[#9CAFC3] uppercase">Recipient</span>
                <div className="font-bold text-[#FFFFFF]">
                  {selectedOrder.shipping_address?.recipientName || "N/A"}
                </div>
                <div className="text-[#9CAFC3]">{selectedOrder.shipping_address?.phone || "No phone"}</div>
                <div className="text-[#9CAFC3]">{selectedOrder.customer_email || "No email"}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#9CAFC3] uppercase">Delivery Address</span>
                <div className="text-[#FFFFFF]">
                  {selectedOrder.shipping_address?.line1}
                  {selectedOrder.shipping_address?.line2 ? `, ${selectedOrder.shipping_address.line2}` : ""}
                </div>
                <div className="text-[#9CAFC3]">
                  {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.stateOrProvince}{" "}
                  {selectedOrder.shipping_address?.postalCode}
                </div>
                <div className="text-[#7DD3FC] font-bold">
                  {selectedOrder.shipping_address?.countryCode === "GB" ? "United Kingdom" : "India"}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
                Order Items ({selectedOrder.items?.length || 1})
              </h4>
              <div className="space-y-1.5">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-[#102A43]/20 border border-[#243447] flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#FFFFFF]">{item.product_name}</div>
                      <div className="font-mono text-[11px] text-[#7DD3FC]">
                        SKU: {item.sku} {item.variant_name ? `• ${item.variant_name}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#FFFFFF]">
                        {selectedOrder.currency === "INR" ? `₹${item.total_price?.toLocaleString("en-IN")}` : `£${item.total_price?.toFixed(2)}`}
                      </div>
                      <div className="text-[11px] text-[#9CAFC3]">Qty: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillment Transition Form */}
            <form onSubmit={handleUpdateFulfillment} className="space-y-4 pt-3 border-t border-[#243447]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#FFFFFF]">Fulfillment Status *</label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="processing">Processing (Pack &amp; Pick)</option>
                    <option value="shipped">Shipped (Dispatched)</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#FFFFFF]">Logistics Carrier</label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g. Blue Dart / DPD"
                    className="w-full h-10 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#FFFFFF]">Tracking Number / AWB</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BLUEDART-981249"
                    className="w-full h-10 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono text-[#7DD3FC] focus:outline-none focus:border-[#7DD3FC]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-semibold text-[#9CAFC3]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-lg shadow-[#7DD3FC]/10 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{updating ? "Saving..." : "Update Dispatch State"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
