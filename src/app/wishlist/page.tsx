"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/context/CartContext";
import { useMarket } from "@/lib/context/MarketContext";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { useState } from "react";

export default function WishlistPage() {
  const { addItem } = useCart();
  const { market } = useMarket();

  // Demonstration initial wishlist items
  const [wishlist, setWishlist] = useState([
    FALLBACK_PRODUCTS[0], // One Acoustic Pro
    FALLBACK_PRODUCTS[2], // One Chronograph
  ]);

  const handleRemove = (productId: string) => {
    setWishlist(wishlist.filter((p) => p.id !== productId));
  };

  const handleMoveToCart = (product: (typeof FALLBACK_PRODUCTS)[0]) => {
    addItem(product, product.variants[0] || null, 1);
    handleRemove(product.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="border-b border-[#243447] pb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-semibold uppercase tracking-wider">
                <Heart className="h-3.5 w-3.5" />
                <span>Saved Essentials</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                My Curated Wishlist
              </h1>
            </div>

            <Link href="/account" className="text-xs text-[#9CAFC3] hover:text-[#FFFFFF]">
              ← Back to Account
            </Link>
          </div>

          {wishlist.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-[#243447] rounded-2xl bg-[#102A43]/20 space-y-4">
              <Heart className="h-12 w-12 text-[#9CAFC3] mx-auto opacity-40" />
              <h2 className="text-lg font-bold text-[#FFFFFF]">Your wishlist is empty</h2>
              <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto">
                Save your favorite flagship releases to track stock and price updates.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all"
              >
                Browse Products <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wishlist.map((item) => {
                const price = market === "IN" ? item.price_inr : item.price_gbp;
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
                    className="p-6 rounded-2xl bg-[#102A43]/40 border border-[#243447] flex flex-col justify-between space-y-6 shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-20 w-20 rounded-xl bg-[#080B10] border border-[#243447] flex items-center justify-center font-mono font-bold text-xl text-[#7DD3FC] shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <span className="text-[11px] font-semibold text-[#7DD3FC] uppercase tracking-wider block">
                          {item.category?.name}
                        </span>
                        <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5">{item.name}</h3>
                        <div className="text-sm font-bold text-[#FFFFFF] mt-2">
                          {formattedPrice}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-[#9CAFC3] hover:text-red-400 p-1"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="pt-4 border-t border-[#243447]/60 flex items-center gap-3">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="flex-1 h-11 px-4 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10"
                      >
                        <ShoppingBag className="h-4 w-4" /> Move to Shopping Cart
                      </button>
                      <Link
                        href={`/products/${item.slug}`}
                        className="h-11 px-4 rounded-xl bg-[#102A43] text-[#FFFFFF] border border-[#243447] hover:border-[#7DD3FC] font-semibold text-xs flex items-center justify-center transition-all"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
