"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/context/CartContext";
import { useMarket } from "@/lib/context/MarketContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";
import type { Product, ProductVariant, Category } from "@/lib/types/database";
import Link from "next/link";
import { Heart, ShoppingBag, ArrowRight, Trash2, Check, Sparkles } from "lucide-react";

type FullProduct = Product & {
  variants?: ProductVariant[];
  category?: Category;
};

export default function WishlistPage() {
  const { addItem, setIsOpen } = useCart();
  const { market } = useMarket();
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const [allProducts, setAllProducts] = useState<FullProduct[]>(FALLBACK_PRODUCTS);
  const [movedMessage, setMovedMessage] = useState<string | null>(null);

  // Fetch complete product catalogue to resolve wishlist item details
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/admin/products");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setAllProducts(data.products);
          }
        }
      } catch {
        // Fallback to FALLBACK_PRODUCTS
      }
    }
    loadProducts();
  }, []);

  // Filter catalog by user's active wishlist IDs
  const wishlistProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  const handleMoveToCart = (product: FullProduct) => {
    const firstVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    addItem(product, firstVariant, 1);
    removeFromWishlist(product.id);
    setMovedMessage(`Moved "${product.name}" to your shopping cart.`);
    setTimeout(() => setMovedMessage(null), 4000);
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B10]">
      <Header />

      <main className="flex-1 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="border-b border-[#243447] pb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#7DD3FC] mb-1 font-semibold uppercase tracking-wider">
                <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                <span>Saved Essentials ({wishlistProducts.length})</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                My Curated Wishlist
              </h1>
            </div>

            <Link href="/products" className="text-xs text-[#9CAFC3] hover:text-[#FFFFFF] flex items-center gap-1.5 transition-colors">
              <span>Continue Shopping</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {movedMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{movedMessage}</span>
            </div>
          )}

          {wishlistProducts.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-[#243447] rounded-2xl bg-[#102A43]/20 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-[#102A43] border border-[#243447] flex items-center justify-center text-[#9CAFC3] mx-auto">
                <Heart className="h-7 w-7 opacity-50 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-[#FFFFFF]">Your wishlist is empty</h2>
              <p className="text-xs text-[#9CAFC3] max-w-sm mx-auto leading-relaxed">
                Save your favorite flagship acoustic gear, minimal carry, and chronographs to monitor stock and prices across India and the UK.
              </p>
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all shadow-lg shadow-[#7DD3FC]/10"
                >
                  <span>Explore Catalogue</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wishlistProducts.map((item) => {
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
                      <div className="h-20 w-20 rounded-xl bg-[#080B10] border border-[#243447] flex items-center justify-center shrink-0 overflow-hidden relative">
                        {item.images && item.images[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <span className="font-mono font-bold text-xl text-[#7DD3FC]">1</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.category && (
                          <span className="text-[11px] font-semibold text-[#7DD3FC] uppercase tracking-wider block font-mono truncate">
                            {item.category.name}
                          </span>
                        )}
                        <h3 className="text-base font-bold text-[#FFFFFF] mt-0.5 truncate">{item.name}</h3>
                        <div className="text-sm font-extrabold text-[#FFFFFF] font-mono mt-1.5">
                          {formattedPrice}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-[#9CAFC3] hover:text-red-400 p-2 rounded-lg hover:bg-red-950/30 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="pt-4 border-t border-[#243447]/60 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        className="flex-1 h-11 px-4 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-xs hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        <span>Move to Shopping Cart</span>
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
