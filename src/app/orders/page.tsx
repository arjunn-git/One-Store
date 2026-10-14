import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default async function OrdersPage() {
  let orders = [];

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
        orders = data || [];
      }
    } catch {
      orders = [];
    }
  }

  // Demonstration sample orders when user has not yet completed a live checkout
  const sampleOrders = [
    {
      id: "ord_sample_01",
      order_number: "OS-2026-IN-4891",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: "shipped",
      payment_status: "succeeded",
      currency: "INR",
      total_amount: 24999.0,
      payment_provider: "razorpay",
      shipping_address: {
        recipientName: "Arjun Taneja",
        city: "Mumbai",
        stateOrProvince: "Maharashtra",
        postalCode: "400001",
        countryCode: "IN",
      },
      items: [
        {
          name: "One Acoustic Pro Wireless",
          variant: "Obsidian Black",
          quantity: 1,
          price: 24999.0,
        },
      ],
      tracking_number: "BLUEDART-EXP-992819",
      carrier: "Blue Dart Air Express",
    },
  ];

  const displayOrders = orders.length > 0 ? orders : sampleOrders;

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

          {/* Orders list */}
          <div className="space-y-6">
            {displayOrders.map((order) => {
              const isIndia = order.currency === "INR";
              const formattedTotal = isIndia
                ? new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(order.total_amount)
                : new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: "GBP",
                    minimumFractionDigits: 2,
                  }).format(order.total_amount);

              const formattedDate = new Date(order.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="rounded-2xl bg-[#102A43]/40 border border-[#243447] overflow-hidden shadow-xl"
                >
                  {/* Top order bar */}
                  <div className="p-6 bg-[#080B10] border-b border-[#243447] flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[#9CAFC3]">Order Reference</span>
                      <div className="font-mono font-bold text-sm text-[#FFFFFF]">
                        {order.order_number}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#9CAFC3]">Placed On</span>
                      <div className="font-semibold text-[#FFFFFF]">{formattedDate}</div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#9CAFC3]">Total Charged</span>
                      <div className="font-bold text-[#7DD3FC]">{formattedTotal}</div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[#9CAFC3]">Fulfillment Status</span>
                      <div>
                        {order.status === "delivered" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Delivered
                          </span>
                        ) : order.status === "shipped" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#102A43] text-[#7DD3FC] border border-[#243447] text-[10px] font-semibold">
                            <Truck className="h-3 w-3" /> In Transit (Tracked)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] font-semibold">
                            <Clock className="h-3 w-3" /> Processing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tracking Timeline */}
                  <div className="p-6 border-b border-[#243447] bg-[#102A43]/20">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#9CAFC3] mb-4">
                      Shipment Progression
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { title: "Order Confirmed", active: true },
                        { title: "Quality Check", active: true },
                        { title: "Dispatched", active: order.status === "shipped" || order.status === "delivered" },
                        { title: "Delivered", active: order.status === "delivered" },
                      ].map((step, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div
                            className={`h-2 rounded-full transition-colors ${
                              step.active ? "bg-[#7DD3FC]" : "bg-[#243447]"
                            }`}
                          />
                          <span
                            className={`text-[11px] font-medium block ${
                              step.active ? "text-[#FFFFFF]" : "text-[#9CAFC3]/60"
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.tracking_number && (
                      <div className="mt-5 p-3 rounded-xl bg-[#080B10] border border-[#243447] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-[#7DD3FC]" />
                          <span>
                            Carrier: <strong className="text-[#FFFFFF]">{order.carrier}</strong> |
                            Waybill:{" "}
                            <strong className="font-mono text-[#7DD3FC]">
                              {order.tracking_number}
                            </strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#7DD3FC] flex items-center gap-1">
                          Live Tracking Active <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="p-6 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="text-[#9CAFC3]">
                      Shipping to:{" "}
                      <strong className="text-[#FFFFFF]">
                        {order.shipping_address?.recipientName},{" "}
                        {order.shipping_address?.city} ({order.shipping_address?.postalCode})
                      </strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/returns-policy`}
                        className="px-4 py-2 rounded-xl bg-[#080B10] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Request Return
                      </Link>
                      <Link
                        href="/support"
                        className="px-4 py-2 rounded-xl bg-[#102A43] border border-[#243447] text-[#7DD3FC] hover:border-[#7DD3FC] font-semibold flex items-center gap-1.5 transition-all"
                      >
                        Order Support →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
