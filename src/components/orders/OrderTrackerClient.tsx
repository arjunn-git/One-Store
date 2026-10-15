"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

export interface TrackedOrder {
  id?: string;
  order_number: string;
  orderNumber?: string;
  created_at: string;
  status: string;
  payment_status: string;
  currency: string;
  total_amount: number;
  payment_provider?: string;
  tracking_number?: string;
  carrier?: string;
  shipping_address?: {
    recipientName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    stateOrProvince?: string;
    postalCode?: string;
    countryCode?: string;
  };
  items?: {
    product_name?: string;
    name?: string;
    variant_name?: string;
    variant?: string;
    quantity: number;
    unit_price?: number;
    price?: number;
    total_price?: number;
    image_url?: string;
  }[];
}

interface OrderTrackerClientProps {
  initialOrders: TrackedOrder[];
}

export function OrderTrackerClient({ initialOrders }: OrderTrackerClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<TrackedOrder | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<TrackedOrder[]>([]);

  // Load any locally stored orders from recent checkouts
  useEffect(() => {
    try {
      const recent: TrackedOrder[] = [];
      const lastOrderStr = localStorage.getItem("one_store_last_order");
      if (lastOrderStr) {
        const lastOrder = JSON.parse(lastOrderStr);
        if (lastOrder && (lastOrder.order_number || lastOrder.orderNumber)) {
          recent.push(lastOrder);
        }
      }

      // Check for any order keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("one_store_order_")) {
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && !recent.some((o) => (o.order_number || o.orderNumber) === (parsed.order_number || parsed.orderNumber))) {
              recent.push(parsed);
            }
          }
        }
      }

      if (recent.length > 0) {
        setLocalOrders(recent);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = searchQuery.trim().replace(/\s+/g, "").toUpperCase();
    if (!cleanRef) return;

    setSearching(true);
    setSearchError(null);
    setSearchedOrder(null);

    try {
      // 1. Try server API
      const res = await fetch(`/api/orders/${encodeURIComponent(cleanRef)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setSearchedOrder(data.order);
          setSearching(false);
          return;
        }
      }

      // 2. Try local cache
      const localMatch = localOrders.find(
        (o) => (o.order_number || o.orderNumber)?.replace(/\s+/g, "").toUpperCase() === cleanRef
      );

      if (localMatch) {
        setSearchedOrder(localMatch);
        setSearching(false);
        return;
      }

      // 3. Try initialOrders
      const initialMatch = initialOrders.find(
        (o) => (o.order_number || o.orderNumber)?.replace(/\s+/g, "").toUpperCase() === cleanRef
      );

      if (initialMatch) {
        setSearchedOrder(initialMatch);
        setSearching(false);
        return;
      }

      setSearchError(`No order record found for reference "${cleanRef}". Please verify your order number.`);
    } catch {
      setSearchError("Unable to reach tracking server. Please check your connection.");
    } finally {
      setSearching(false);
    }
  };

  const getTimelineSteps = (status: string) => {
    const isPaid = status !== "pending_payment";
    const isProcessing = ["processing", "paid", "shipped", "delivered"].includes(status);
    const isShipped = ["shipped", "delivered"].includes(status);
    const isDelivered = status === "delivered";

    return [
      { label: "Order Placed", done: true, time: "Confirmed" },
      { label: "Payment Verified", done: isPaid, time: isPaid ? "Succeeded" : "Awaiting" },
      { label: "Regional Dispatch", done: isProcessing, time: isProcessing ? "Prepared" : "Pending" },
      { label: "Express Logistics", done: isShipped, time: isShipped ? "In Transit" : "Upcoming" },
      { label: "Doorstep Delivery", done: isDelivered, time: isDelivered ? "Delivered" : "Final Step" },
    ];
  };

  const allOrdersList = [
    ...localOrders,
    ...initialOrders.filter(
      (init) => !localOrders.some((loc) => (loc.order_number || loc.orderNumber) === (init.order_number || init.orderNumber))
    ),
  ];

  return (
    <div className="space-y-10">
      {/* Live Order Tracking Lookup Box */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#102A43]/60 to-[#080B10] border border-[#7DD3FC]/40 shadow-2xl shadow-[#7DD3FC]/5">
        <div className="max-w-xl mx-auto text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102A43] border border-[#7DD3FC]/40 text-xs font-semibold text-[#7DD3FC]">
            <Truck className="h-3.5 w-3.5" />
            <span>Real-Time Express Tracking</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
            Track Any Dispatch Across India &amp; UK
          </h2>
          <p className="text-xs text-[#9CAFC3] leading-relaxed">
            Enter your unique One Store Order Reference (e.g. <span className="font-mono text-[#7DD3FC]">OS-2026-IN-XXXX</span> or <span className="font-mono text-[#7DD3FC]">OS-2026-GB-XXXX</span>) for instant milestone status.
          </p>
        </div>

        <form onSubmit={handleTrackSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. OS-2026-IN-1001"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono uppercase text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC] shadow-inner"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="h-12 px-6 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 shadow-lg shadow-[#7DD3FC]/10"
          >
            {searching ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Track Status</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {searchError && (
          <div className="max-w-xl mx-auto mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Live Tracking Result Modal / Card */}
        {searchedOrder && (
          <div className="max-w-3xl mx-auto mt-8 p-6 rounded-2xl bg-[#0c141e] border border-[#7DD3FC]/50 shadow-2xl space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447] pb-4">
              <div>
                <span className="text-[10px] font-mono text-[#7DD3FC] uppercase tracking-widest block font-bold">
                  Matched Order Result
                </span>
                <h3 className="text-lg font-black text-[#FFFFFF] font-mono mt-0.5">
                  {searchedOrder.order_number || searchedOrder.orderNumber}
                </h3>
                <span className="text-xs text-[#9CAFC3]">
                  Placed on {new Date(searchedOrder.created_at).toLocaleDateString("en-GB", { dateStyle: "long" })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40">
                  {searchedOrder.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  {searchedOrder.payment_status}
                </span>
              </div>
            </div>

            {/* 5-Step Timeline Visualizer */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#9CAFC3]">
                Fulfillment Milestones
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {getTimelineSteps(searchedOrder.status).map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-center space-y-1.5 transition-all ${
                      step.done
                        ? "bg-[#102A43] border-[#7DD3FC]/60 text-[#FFFFFF]"
                        : "bg-[#080B10] border-[#243447] text-[#9CAFC3]/60 opacity-60"
                    }`}
                  >
                    <div className="flex justify-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          step.done ? "bg-[#7DD3FC] text-[#080B10]" : "bg-[#243447] text-[#9CAFC3]"
                        }`}
                      >
                        {step.done ? "✓" : idx + 1}
                      </div>
                    </div>
                    <div className="text-[11px] font-bold leading-tight">{step.label}</div>
                    <div className="text-[10px] font-mono text-[#7DD3FC]">{step.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logistics & Courier Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-[#7DD3FC]" />
                  <span>Logistics Courier</span>
                </div>
                <div className="text-[#9CAFC3]">
                  {searchedOrder.carrier || (searchedOrder.currency === "INR" ? "Blue Dart Air Express" : "Royal Mail Tracked 24")}
                </div>
                {searchedOrder.tracking_number && (
                  <div className="text-[11px] font-mono text-[#7DD3FC]">
                    AWB: {searchedOrder.tracking_number}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-[#FFFFFF]">Shipping Address</div>
                <div className="text-[#9CAFC3]">
                  {searchedOrder.shipping_address?.recipientName && (
                    <span className="font-semibold block text-[#FFFFFF]">
                      {searchedOrder.shipping_address.recipientName}
                    </span>
                  )}
                  {searchedOrder.shipping_address?.line1 && (
                    <span>{searchedOrder.shipping_address.line1}, </span>
                  )}
                  {searchedOrder.shipping_address?.city && (
                    <span>{searchedOrder.shipping_address.city}, </span>
                  )}
                  {searchedOrder.shipping_address?.countryCode === "GB" ? "United Kingdom" : "India"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders History List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#243447] pb-4">
          <h2 className="text-lg font-bold text-[#FFFFFF]">
            Your Recent Orders ({allOrdersList.length})
          </h2>
          <span className="text-xs text-[#9CAFC3]">
            Dual-Market Logistics (India &amp; UK)
          </span>
        </div>

        {allOrdersList.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#243447] rounded-2xl bg-[#102A43]/20 space-y-4">
            <Package className="h-12 w-12 text-[#9CAFC3] mx-auto opacity-40" />
            <h3 className="text-base font-bold text-[#FFFFFF]">No Recorded Orders</h3>
            <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto">
              You haven't placed any orders in this session yet. Complete checkout to track your items here.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all"
            >
              Browse Catalogue <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {allOrdersList.map((order) => {
              const orderNum = order.order_number || order.orderNumber || "ORDER";
              const isINR = order.currency === "INR";
              const formattedPrice = isINR
                ? new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(order.total_amount || 0)
                : new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    minimumFractionDigits: 2,
                  }).format(order.total_amount || 0);

              return (
                <div
                  key={order.id || orderNum}
                  className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] hover:border-[#7DD3FC]/50 transition-all space-y-4 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447]/60 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm text-[#7DD3FC]">
                          {orderNum}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#080B10] text-[#9CAFC3] border border-[#243447]">
                          {order.payment_provider || (isINR ? "Razorpay" : "Stripe")}
                        </span>
                      </div>
                      <span className="text-xs text-[#9CAFC3] mt-1 block">
                        Ordered on {new Date(order.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-[#9CAFC3] uppercase tracking-wider">Total</div>
                        <div className="font-mono font-bold text-sm text-[#FFFFFF]">{formattedPrice}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(orderNum);
                          setSearchedOrder(order);
                          window.scrollTo({ top: 100, behavior: "smooth" });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40 text-xs font-semibold hover:bg-[#7DD3FC] hover:text-[#080B10] transition-all"
                      >
                        Track Status
                      </button>
                    </div>
                  </div>

                  {/* Items Summary */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-[#9CAFC3]">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#7DD3FC]" />
                            <span className="text-[#FFFFFF] font-medium">
                              {it.product_name || it.name || "Engineered Product"}
                            </span>
                            {(it.variant_name || it.variant) && (
                              <span className="text-[#7DD3FC] text-[11px]">
                                ({it.variant_name || it.variant})
                              </span>
                            )}
                          </div>
                          <span>Qty: {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
