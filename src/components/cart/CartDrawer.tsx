"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/context/CartContext";
import { useMarket } from "@/lib/context/MarketContext";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

export function CartDrawer() {
  const {
    items,
    itemCount,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    formattedSubtotal,
    formattedShippingFee,
    formattedTotal,
  } = useCart();
  const { market } = useMarket();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden" role="dialog" aria-modal="true">
      {/* Opaque Dimmed Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-[#080B10]/80 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10 z-[101]">
        <div className="w-screen max-w-md h-full bg-[#080B10] border-l border-[#243447] text-[#FFFFFF] shadow-2xl flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#243447] bg-[#0c131c]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#102A43] border border-[#243447] flex items-center justify-center text-[#7DD3FC]">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#FFFFFF]">Shopping Cart</h2>
                <span className="text-xs text-[#9CAFC3]">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] border border-transparent hover:border-[#243447] transition-all"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#080B10]">
            {items.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-[#102A43]/40 border border-[#243447] flex items-center justify-center text-[#9CAFC3]">
                  <ShoppingBag className="h-8 w-8 opacity-60" />
                </div>
                <div className="text-base font-semibold text-[#FFFFFF]">Your cart is empty</div>
                <p className="text-xs text-[#9CAFC3] max-w-xs mx-auto leading-relaxed">
                  Explore our curated flagship essentials for dual-market dispatch across India &amp; the UK.
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] text-xs font-semibold hover:border-[#7DD3FC] hover:bg-[#7DD3FC] hover:text-[#080B10] transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const price = market === "IN" ? item.priceInr : item.priceGbp;
                const formattedPrice =
                  market === "IN"
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(price)
                    : new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: "GBP",
                        minimumFractionDigits: 2,
                      }).format(price);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#102A43]/40 border border-[#243447] flex gap-4"
                  >
                    <div className="h-16 w-16 rounded-lg bg-[#080B10] border border-[#243447] flex items-center justify-center shrink-0 font-mono font-bold text-[#7DD3FC] text-sm">
                      1
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-[#FFFFFF] truncate">
                            {item.productName}
                          </h4>
                          {item.variantName && (
                            <span className="text-[11px] text-[#7DD3FC] block">
                              {item.variantName}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#9CAFC3] hover:text-red-400 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#243447]/60">
                        <span className="text-xs font-bold text-[#FFFFFF]">{formattedPrice}</span>

                        <div className="flex items-center rounded-lg border border-[#243447] bg-[#080B10] px-2 py-1 text-xs">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-[#9CAFC3] hover:text-[#FFFFFF] p-0.5"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-mono text-[11px]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.maxInventory}
                            className="text-[#9CAFC3] hover:text-[#FFFFFF] p-0.5 disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Opaque Solid Footer summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#243447] bg-[#0c131c] space-y-4 shadow-2xl">
              <div className="space-y-1.5 text-xs text-[#9CAFC3]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[#FFFFFF] font-semibold">{formattedSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Logistics</span>
                  <span className="text-[#7DD3FC] font-semibold">{formattedShippingFee}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#FFFFFF] pt-2 border-t border-[#243447]/60">
                  <span>Estimated Total</span>
                  <span className="text-[#7DD3FC] text-base">{formattedTotal}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className="h-11 px-4 rounded-xl bg-[#102A43] text-[#FFFFFF] border border-[#243447] hover:border-[#7DD3FC] font-semibold text-xs flex items-center justify-center transition-all"
                >
                  View Full Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="h-11 px-4 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] flex items-center justify-center gap-1.5 shadow-lg shadow-[#7DD3FC]/10 transition-all"
                >
                  <span>Checkout</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
