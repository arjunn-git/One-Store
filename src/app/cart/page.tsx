"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/context/CartContext";
import { useMarket } from "@/lib/context/MarketContext";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  PackageOpen,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    itemCount,
    removeItem,
    updateQuantity,
    subtotal,
    shippingFee,
    formattedSubtotal,
    formattedShippingFee,
  } = useCart();
  const { market } = useMarket();

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);

    const clean = promoCode.trim().toUpperCase();
    if (clean === "LAUNCH10") {
      setAppliedPromo({ code: "LAUNCH10", discountPercent: 10 });
    } else if (clean === "WELCOME50") {
      setAppliedPromo({ code: "WELCOME50", discountPercent: 15 });
    } else {
      setPromoError("Invalid promotional code. Please try LAUNCH10.");
    }
  };

  const discountAmount = appliedPromo ? (subtotal * appliedPromo.discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const formatCurrency = (amount: number) => {
    if (market === "IN") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Heading */}
          <div className="border-b border-[#243447] pb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-xs text-[#9CAFC3] mt-1.5">
              Review selected models before proceeding to dual-currency checkout.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-[#243447] rounded-2xl bg-[#102A43]/20 space-y-4">
              <PackageOpen className="h-14 w-14 text-[#9CAFC3] mx-auto opacity-40" />
              <h2 className="text-xl font-bold text-[#FFFFFF]">Your cart is currently empty</h2>
              <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto">
                Discover engineered audio, carry, and timepieces designed for India &amp; the UK.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all shadow-lg shadow-[#7DD3FC]/10"
              >
                Browse Catalogue <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              {/* Line Items List (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                  const price = market === "IN" ? item.priceInr : item.priceGbp;
                  const itemTotal = price * item.quantity;

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-[#102A43]/40 border border-[#243447] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-xl bg-[#080B10] border border-[#243447] flex items-center justify-center font-mono font-bold text-xl text-[#7DD3FC] shrink-0">
                          1
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-[#FFFFFF]">{item.productName}</h3>
                          {item.variantName && (
                            <span className="text-xs text-[#7DD3FC] block">
                              Option: {item.variantName}
                            </span>
                          )}
                          <div className="font-mono text-[11px] text-[#9CAFC3]">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-8 pt-4 sm:pt-0 border-t sm:border-0 border-[#243447]/60">
                        {/* Stepper */}
                        <div className="flex items-center rounded-lg border border-[#243447] bg-[#080B10] px-2.5 py-1 text-xs">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-[#9CAFC3] hover:text-[#FFFFFF] p-1"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxInventory}
                            className="text-[#9CAFC3] hover:text-[#FFFFFF] p-1 disabled:opacity-30"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-[90px]">
                          <div className="text-sm font-bold text-[#FFFFFF]">
                            {formatCurrency(itemTotal)}
                          </div>
                          <div className="text-[10px] text-[#9CAFC3]">
                            {formatCurrency(price)} each
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#9CAFC3] hover:text-red-400 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary & Checkout Sidebar (1 col) */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] space-y-6">
                  <h2 className="text-lg font-bold text-[#FFFFFF] border-b border-[#243447] pb-4">
                    Order Summary
                  </h2>

                  {/* Promo Code Form */}
                  <form onSubmit={handleApplyPromo} className="space-y-2">
                    <label className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#7DD3FC]" />
                      <span>Promotional Code</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="e.g. LAUNCH10"
                        className="flex-1 h-11 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono uppercase text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
                      />
                      <button
                        type="submit"
                        className="px-4 h-11 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] text-xs font-semibold hover:border-[#7DD3FC] hover:text-[#FFFFFF]"
                      >
                        Apply
                      </button>
                    </div>

                    {appliedPromo && (
                      <div className="text-xs text-emerald-400 flex items-center gap-1 pt-1">
                        <Check className="h-3.5 w-3.5" /> Applied code {appliedPromo.code} (
                        {appliedPromo.discountPercent}% off)
                      </div>
                    )}

                    {promoError && (
                      <div className="text-xs text-red-400 pt-1">{promoError}</div>
                    )}
                  </form>

                  {/* Breakdown */}
                  <div className="space-y-2.5 text-xs text-[#9CAFC3] pt-4 border-t border-[#243447]">
                    <div className="flex justify-between">
                      <span>Items Subtotal ({itemCount})</span>
                      <span className="text-[#FFFFFF] font-semibold">{formattedSubtotal}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Campaign Discount</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Logistics ({market === "IN" ? "India" : "UK"})</span>
                      <span className="text-[#7DD3FC] font-semibold">{formattedShippingFee}</span>
                    </div>

                    <div className="flex justify-between text-base font-extrabold text-[#FFFFFF] pt-3 border-t border-[#243447]">
                      <span>Total Amount</span>
                      <span className="text-[#7DD3FC]">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <Link
                    href="/checkout"
                    className="w-full h-12 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10 transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-[#9CAFC3] text-center pt-2">
                    <ShieldCheck className="h-4 w-4 text-[#7DD3FC]" />
                    <span>256-bit encrypted checkout</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
