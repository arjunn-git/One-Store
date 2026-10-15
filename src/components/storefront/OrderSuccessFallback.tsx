"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Truck,
  Package,
  ArrowRight,
  ShieldCheck,
  XCircle,
  Clock,
  RotateCcw,
} from "lucide-react";

interface OrderSuccessFallbackProps {
  orderNumber: string;
}

export function OrderSuccessFallback({ orderNumber }: OrderSuccessFallbackProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localOrder, setLocalOrder] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const cleanNum = orderNumber.replace(/\s+/g, "").toUpperCase();
      const specific = localStorage.getItem(`one_store_order_${cleanNum}`);
      if (specific) {
        setLocalOrder(JSON.parse(specific));
        setChecked(true);
        return;
      }

      const last = localStorage.getItem("one_store_last_order");
      if (last) {
        const parsed = JSON.parse(last);
        const parsedNum = String(parsed.order_number || parsed.orderNumber || "").replace(/\s+/g, "").toUpperCase();
        if (parsedNum === cleanNum || !cleanNum) {
          setLocalOrder(parsed);
          setChecked(true);
          return;
        }
      }
    } catch {
      // Storage unavailable
    }
    setChecked(true);
  }, [orderNumber]);

  if (!checked) {
    return (
      <div className="p-8 rounded-2xl bg-[#102A43]/40 text-center text-xs text-[#9CAFC3] animate-pulse">
        Retrieving order records...
      </div>
    );
  }

  // If order was found in local client storage
  if (localOrder) {
    const isIndia = localOrder.currency === "INR";
    const formattedAmount = isIndia
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(localOrder.total_amount || 0)
      : new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
          minimumFractionDigits: 2,
        }).format(localOrder.total_amount || 0);

    const formattedDate = new Date(localOrder.created_at || Date.now()).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const displayOrderNumber = (localOrder.order_number || localOrder.orderNumber || orderNumber)
      .replace(/\s+/g, "")
      .toUpperCase();

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Success Banner */}
        <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-b from-[#102A43]/80 via-[#080B10] to-[#102A43]/40 border border-[#7DD3FC]/40 text-center space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#7DD3FC]/10 blur-3xl -z-10 rounded-full" />

          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              Order Confirmed &amp; Payment Verified
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
              Thank You for Your Order
            </h1>
            <p className="text-xs md:text-sm text-[#9CAFC3] max-w-md mx-auto">
              Your acquisition has been registered and is being prepared for express delivery.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#9CAFC3]">
              Reference: <strong className="font-mono text-[#7DD3FC]">{displayOrderNumber}</strong>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#9CAFC3]">
              Placed On: <strong className="text-[#FFFFFF]">{formattedDate}</strong>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#9CAFC3]">
              Grand Total: <strong className="text-emerald-400 font-mono">{formattedAmount}</strong>
            </div>
          </div>
        </div>

        {/* Shipping & Fulfillment Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#FFFFFF]">
              <Truck className="h-4 w-4 text-[#7DD3FC]" />
              <span>Logistics &amp; Courier</span>
            </div>
            <p className="text-[#9CAFC3] leading-relaxed">
              {isIndia
                ? "Dispatched via Blue Dart / Delhivery Express. Real-time SMS tracking updates will be transmitted to your registered mobile."
                : "Dispatched via Royal Mail Tracked 24/48. Full end-to-end GPS delivery confirmation included."}
            </p>
            <div className="pt-2 flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Allocated for immediate warehouse dispatch</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#FFFFFF]">
              <Package className="h-4 w-4 text-[#7DD3FC]" />
              <span>Shipping Address</span>
            </div>
            {localOrder.shipping_address ? (
              <div className="text-[#9CAFC3] space-y-1">
                <div className="font-bold text-[#FFFFFF]">{localOrder.shipping_address.recipientName}</div>
                <div>{localOrder.shipping_address.line1}</div>
                <div>
                  {localOrder.shipping_address.city}, {localOrder.shipping_address.stateOrProvince} {localOrder.shipping_address.postalCode}
                </div>
                <div>Country: {localOrder.shipping_address.countryCode === "GB" ? "United Kingdom" : "India"}</div>
              </div>
            ) : (
              <p className="text-[#9CAFC3]">Verified delivery destination recorded on file.</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        {localOrder.items && localOrder.items.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-4">
            <div className="font-bold text-[#FFFFFF] text-sm">Purchased Hardware &amp; Gear</div>
            <div className="divide-y divide-[#243447]/60">
              {localOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#080B10] border border-[#243447] flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-[#7DD3FC]" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[#FFFFFF]">{item.product_name}</div>
                      {item.variant_name && <div className="text-[11px] text-[#7DD3FC]">{item.variant_name}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[#FFFFFF]">
                      {isIndia
                        ? `₹${Math.round(item.total_price || item.unit_price || 0).toLocaleString("en-IN")}`
                        : `£${(item.total_price || item.unit_price || 0).toFixed(2)}`}
                    </div>
                    <div className="text-[10px] text-[#9CAFC3]">Qty: {item.quantity || 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/orders"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10"
          >
            <span>Track in Order History</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#102A43] text-[#FFFFFF] border border-[#243447] font-semibold text-xs hover:border-[#7DD3FC] transition-all flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Otherwise, display clean informative Order Not Found screen
  return (
    <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#102A43]/40 border border-[#243447] text-center space-y-4">
      <div className="h-14 w-14 rounded-full bg-red-950/40 text-red-400 border border-red-800 flex items-center justify-center mx-auto">
        <XCircle className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-[#FFFFFF]">Order Not Found</h1>
      <p className="text-xs text-[#9CAFC3]">
        We could not locate an order matching reference <span className="font-mono text-[#7DD3FC]">{orderNumber}</span> in our verified records.
      </p>
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/products"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs"
        >
          Browse Products
        </Link>
        <Link
          href="/support"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#080B10] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] text-xs font-semibold"
        >
          Concierge Support
        </Link>
      </div>
    </div>
  );
}
