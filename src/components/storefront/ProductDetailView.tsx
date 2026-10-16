"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMarket } from "@/lib/context/MarketContext";
import { useCart } from "@/lib/context/CartContext";
import { useWishlist } from "@/lib/context/WishlistContext";
import { getOrCreateAnonymousSessionId } from "@/lib/services/session";
import { PriceDisplay } from "./PriceDisplay";
import { VariantSelector } from "./VariantSelector";
import type { Product, ProductVariant, Category } from "@/lib/types/database";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Check,
  Plus,
  Minus,
  AlertCircle,
  XCircle,
  Globe,
  Heart,
} from "lucide-react";

interface ProductDetailViewProps {
  product: Product & {
    variants: ProductVariant[];
    category?: Category;
  };
  relatedProducts?: (Product & { variants: ProductVariant[]; category?: Category })[];
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { market, setMarket } = useMarket();
  const { addItem, setIsOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFav = isInWishlist(product.id);

  // Selected variant state
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variant adjustments
  const adjInr = selectedVariant ? selectedVariant.price_inr_adjustment : 0;
  const adjGbp = selectedVariant ? selectedVariant.price_gbp_adjustment : 0;

  // Inventory logic
  const currentStock = selectedVariant ? selectedVariant.inventory_count : 10;
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;
  const isAvailableInCurrentMarket =
    market === "IN" ? product.available_in_in !== false : product.available_in_gb !== false;

  const router = useRouter();

  // Instrument genuine product view activity for real-time telemetry
  useEffect(() => {
    if (!product?.id) return;
    try {
      const sessionId = getOrCreateAnonymousSessionId();
      fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          type: "PRODUCT_VIEW",
          action: `Viewed Product: ${product.name}`,
          market,
          currency: market === "GB" ? "GBP" : "INR",
          resourceType: "products",
          resourceId: product.id,
          anonymousSessionId: sessionId,
          details: {
            productName: product.name,
            sku: product.sku,
          },
        }),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }
  }, [product?.id, product?.name, product?.sku, market]);

  const handleBuyNow = () => {
    if (isOutOfStock || !isAvailableInCurrentMarket) return;
    addItem(product, selectedVariant, quantity);
    router.push("/checkout");
  };

  const handleAddToCart = () => {
    if (isOutOfStock || !isAvailableInCurrentMarket) return;
    addItem(product, selectedVariant, quantity);
    setAddedToCart(true);
    setIsOpen(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 2500);
  };

  return (
    <div className="space-y-16">
      {/* Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Product Image Stage */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl bg-[#080B10] border border-[#243447] flex items-center justify-center p-4 overflow-hidden shadow-2xl">
            {product.images && product.images.length > 0 ? (
              <img
                key={activeImageIndex}
                src={product.images[activeImageIndex] || product.images[0]}
                alt={`${product.name} — ${selectedVariant?.name || "View"}`}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover rounded-xl transition-all duration-300 animate-in fade-in zoom-in-95"
              />
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="w-40 h-40 rounded-3xl bg-[#102A43] border border-[#243447] flex items-center justify-center text-[#7DD3FC] shadow-2xl">
                  <span className="font-mono text-5xl font-black">1</span>
                </div>
                <div className="mt-6 font-mono text-xs text-[#9CAFC3] uppercase tracking-widest">
                  SKU: {selectedVariant?.sku || product.sku}
                </div>
              </div>
            )}

            {/* Badges */}
            {product.is_test_data ? (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-950/90 text-amber-300 border border-amber-800 text-xs font-mono font-bold tracking-wider shadow-lg">
                UK TEST DATA RECORD
              </span>
            ) : product.is_featured ? (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#7DD3FC] text-[#080B10] text-xs font-bold uppercase tracking-wider shadow-lg">
                Featured Flagship
              </span>
            ) : null}
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    if (product.variants && product.variants[idx]) {
                      setSelectedVariant(product.variants[idx]);
                    }
                  }}
                  className={`h-16 w-16 shrink-0 rounded-xl border overflow-hidden transition-all ${
                    activeImageIndex === idx
                      ? "border-[#7DD3FC] ring-2 ring-[#7DD3FC]/40 scale-105"
                      : "border-[#243447] opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Actions & Specs */}
        <div className="space-y-6">
          {/* Category */}
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7DD3FC]">
              {product.category.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#FFFFFF] tracking-tight">
            {product.name}
          </h1>

          {/* Price display with variant adjustments */}
          <div className="p-4 rounded-xl bg-[#102A43]/30 border border-[#243447]">
            <PriceDisplay
              priceInr={product.price_inr}
              priceGbp={product.price_gbp}
              compareAtPriceInr={product.compare_at_price_inr}
              compareAtPriceGbp={product.compare_at_price_gbp}
              adjustmentInr={adjInr}
              adjustmentGbp={adjGbp}
              size="xl"
            />
            <div className="text-[11px] text-[#9CAFC3] mt-1">
              Includes applicable taxes &amp; standard domestic dispatch.
            </div>
          </div>

          {/* Test Record Notice */}
          {product.is_test_data && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs flex items-start gap-3 text-amber-300 shadow-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[11px] block">
                  Development Test Record
                </span>
                <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                  This item is an illustrative development seed record for the UK market. Stock, prices, and specifications are for testing and evaluation.
                </p>
              </div>
            </div>
          )}

          {/* Market Mismatch Alert */}
          {!isAvailableInCurrentMarket && (
            <div className="p-4 rounded-xl bg-[#102A43] border border-[#7DD3FC]/50 text-xs space-y-2.5 shadow-md">
              <div className="flex items-center gap-2 font-bold text-[#7DD3FC]">
                <Globe className="h-4 w-4 shrink-0" />
                <span>Regional Market Availability</span>
              </div>
              <p className="text-[#9CAFC3] text-xs leading-relaxed">
                {market === "IN"
                  ? "This item is configured for the United Kingdom catalogue and dispatched in GBP (£)."
                  : "This item is configured for the India catalogue and dispatched in INR (₹)."}
              </p>
              <button
                type="button"
                onClick={() => setMarket(market === "IN" ? "GB" : "IN")}
                className="px-4 py-2 rounded-lg bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all flex items-center gap-2"
              >
                <span>Switch to {market === "IN" ? "United Kingdom (£ GBP)" : "India (₹ INR)"}</span>
              </button>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-[#9CAFC3] leading-relaxed">{product.description}</p>

          {/* Interactive Variant Picker */}
          {product.variants && product.variants.length > 0 && (
            <div className="pt-2">
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                images={product.images}
                onSelectVariant={(v, idx) => {
                  setSelectedVariant(v);
                  if (quantity > v.inventory_count && v.inventory_count > 0) {
                    setQuantity(v.inventory_count);
                  }
                  // Dynamically switch product photo to match selected variant
                  if (product.images && product.images.length > 0) {
                    const targetIdx =
                      idx !== undefined && idx < product.images.length
                        ? idx
                        : product.variants.findIndex((x) => x.id === v.id);

                    if (targetIdx >= 0 && targetIdx < product.images.length) {
                      setActiveImageIndex(targetIdx);
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Stock state feedback */}
          <div className="flex items-center gap-2 text-xs">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-red-400 font-medium">
                <XCircle className="h-4 w-4" /> This variant is currently sold out.
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
                <AlertCircle className="h-4 w-4" /> Low inventory: Only {currentStock} units
                remaining for immediate dispatch.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#7DD3FC] font-medium">
                <ShieldCheck className="h-4 w-4" /> Ready for dispatch: {currentStock} units in stock.
              </span>
            )}
          </div>

          {/* Dual-Market Logistics Banner */}
          <div className="p-4 rounded-xl bg-[#080B10] border border-[#243447] text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#FFFFFF]">
              <Truck className="h-4 w-4 text-[#7DD3FC]" />
              <span>
                {market === "IN"
                  ? "India Express Logistics (INR ₹)"
                  : "UK Royal Mail / DPD Tracked (GBP £)"}
              </span>
            </div>
            <p className="text-[#9CAFC3] text-[11px] leading-relaxed">
              {market === "IN"
                ? "Air express dispatch from regional domestic hubs. Estimated arrival: 3-5 business days across all Indian PIN codes."
                : "Next-day dispatch from UK fulfillment centre. Estimated arrival: 2-4 business days across England, Scotland, Wales & NI."}
            </p>
          </div>

          {/* Quantity & Add to Cart Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
            {/* Quantity Stepper */}
            <div className="flex items-center justify-between sm:justify-center rounded-xl border border-[#243447] bg-[#102A43] px-3 py-2 text-xs font-semibold text-[#FFFFFF] min-h-[44px]">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="text-[#9CAFC3] hover:text-[#FFFFFF] disabled:opacity-30 disabled:cursor-not-allowed p-2 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-12 text-center font-mono text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                disabled={quantity >= currentStock || isOutOfStock}
                className="text-[#9CAFC3] hover:text-[#FFFFFF] disabled:opacity-30 disabled:cursor-not-allowed p-2 min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || !isAvailableInCurrentMarket}
              className={`flex-1 w-full sm:w-auto min-h-[48px] px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                !isAvailableInCurrentMarket
                  ? "bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/40 cursor-not-allowed opacity-90"
                  : isOutOfStock
                  ? "bg-[#243447] text-[#9CAFC3] cursor-not-allowed"
                  : addedToCart
                  ? "bg-emerald-500 text-[#080B10] shadow-lg shadow-emerald-500/20"
                  : "bg-[#7DD3FC] text-[#080B10] hover:bg-[#FFFFFF] shadow-lg shadow-[#7DD3FC]/10"
              }`}
            >
              {addedToCart ? (
                <>
                  <Check className="h-4 w-4" /> Added to One Store Cart!
                </>
              ) : !isAvailableInCurrentMarket ? (
                <>
                  <Globe className="h-4 w-4" /> Switch Country to Order
                </>
              ) : isOutOfStock ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Add to Cart
                </>
              )}
            </button>

            {/* Buy Now CTA */}
            {!isOutOfStock && isAvailableInCurrentMarket && (
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full sm:w-auto min-h-[48px] px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-[#FFFFFF] text-[#080B10] hover:bg-[#7DD3FC] shadow-lg shadow-white/5"
              >
                <span>Buy Now</span>
              </button>
            )}

            {/* Wishlist Toggle Button */}
            <button
              type="button"
              onClick={() => toggleWishlist({ id: product.id, name: product.name })}
              aria-label={isFav ? "Remove from wishlist" : "Save to wishlist"}
              title={isFav ? "In Wishlist (Click to remove)" : "Save to Wishlist"}
              className={`min-h-[48px] px-4 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                isFav
                  ? "bg-red-950/80 border-red-500 text-red-400 shadow-md shadow-red-500/20"
                  : "bg-[#102A43] border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] hover:border-[#7DD3FC]"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-red-400 text-red-400" : ""}`} />
              <span className="hidden sm:inline">{isFav ? "Saved" : "Save"}</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-[#243447]/60 text-xs text-[#9CAFC3]">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#7DD3FC]" />
              <span>14-day hassle-free returns</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#7DD3FC]" />
              <span>1-Year comprehensive warranty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
