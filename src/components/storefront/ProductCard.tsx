"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, AlertCircle, XCircle, Sparkles, Heart } from "lucide-react";
import { PriceDisplay } from "./PriceDisplay";
import { useWishlist } from "@/lib/context/WishlistContext";
import type { Product, ProductVariant, Category } from "@/lib/types/database";

interface ProductCardProps {
  product: Product & {
    variants?: ProductVariant[];
    category?: Category;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFav = isInWishlist(product.id);
  const productUrl = `/products/${product.slug}`;

  // Compute overall inventory from variants or product
  const totalStock = product.variants?.reduce((sum, v) => sum + v.inventory_count, 0) ?? 10;
  const isOutOfStock = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle luxury 3D tilt: max 8 degrees
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
        cardRef.current.style.setProperty("--glare-x", `${glareX.toFixed(1)}%`);
        cardRef.current.style.setProperty("--glare-y", `${glareY.toFixed(1)}%`);
        cardRef.current.style.setProperty("--glare-op", "0.22");
      }
    });
  };

  const handleMouseEnter = () => {
    router.prefetch(productUrl);
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.1s ease-out";
    }
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      cardRef.current.style.setProperty("--glare-op", "0");
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent card navigation if the user clicked inside the wishlist button or other interactive controls
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[data-no-card-redirect]")) {
      return;
    }
    router.push(productUrl);
  };

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
      }}
      className="group relative flex flex-col rounded-2xl bg-[#102A43]/50 border border-[#243447] hover:border-[#7DD3FC]/80 overflow-hidden shadow-md hover:shadow-2xl hover:shadow-[#7DD3FC]/10 will-change-transform cursor-pointer select-none"
    >
      {/* 3D Dynamic Holographic Specular Glare */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-2xl"
        style={{
          background:
            "radial-gradient(circle 350px at var(--glare-x, 50%) var(--glare-y, 50%), rgba(125, 211, 252, var(--glare-op, 0)) 0%, transparent 80%)",
        }}
      />

      {/* Product Image Stage with 3D Depth */}
      <div
        style={{ transformStyle: "preserve-3d" }}
        className="relative aspect-square w-full bg-[#080B10] flex items-center justify-center p-6 overflow-hidden border-b border-[#243447]"
      >
        {/* Subtle geometric backdrop */}
        <div className="absolute inset-0 bg-radial from-[#102A43]/60 via-transparent to-transparent opacity-60 group-hover:scale-115 transition-transform duration-700 pointer-events-none"></div>

        {/* Product Image Stage with 3D Depth */}
        {product.images && product.images[0] ? (
          <Link
            href={productUrl}
            prefetch={true}
            className="relative z-10 w-full h-full flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300 focus:outline-none"
            tabIndex={-1}
            aria-hidden="true"
          >
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover rounded-xl shadow-lg border border-[#243447]/60 pointer-events-none"
            />
          </Link>
        ) : (
          <Link
            href={productUrl}
            prefetch={true}
            className="relative z-10 flex flex-col items-center justify-center text-center p-4 group-hover:scale-105 transition-transform duration-300 focus:outline-none"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div className="w-20 h-20 rounded-2xl bg-[#102A43] border border-[#243447] flex items-center justify-center text-[#7DD3FC] group-hover:border-[#7DD3FC] group-hover:shadow-lg group-hover:shadow-[#7DD3FC]/20 transition-all duration-300 shadow-inner">
              <span className="font-mono text-2xl font-black">1</span>
            </div>
            <span className="text-[11px] font-mono text-[#9CAFC3] mt-3 uppercase tracking-widest font-semibold">
              {product.sku}
            </span>
          </Link>
        )}

        {/* Featured or Test Data badge (3D Popped) */}
        {product.is_test_data ? (
          <div
            className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold tracking-wider shadow-md flex items-center gap-1 group-hover:scale-105 transition-transform duration-200 pointer-events-none"
          >
            <span>UK TEST DATA</span>
          </div>
        ) : product.is_featured ? (
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#7DD3FC] text-[#080B10] text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 group-hover:scale-105 transition-transform duration-200 pointer-events-none"
          >
            <Sparkles className="h-3 w-3" />
            <span>Featured</span>
          </div>
        ) : null}

        {/* Stock status badge */}
        <div
          className="absolute top-3 right-3 group-hover:scale-105 transition-transform duration-200 pointer-events-none"
        >
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800">
              <XCircle className="h-3 w-3" /> Out of stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
              <AlertCircle className="h-3 w-3" /> Only {totalStock} left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <CheckCircle2 className="h-3 w-3" /> In Stock
            </span>
          )}
        </div>
      </div>

      {/* Content details with 3D Depth */}
      <div
        className="flex flex-col flex-1 p-5 group-hover:translate-y-[-2px] transition-transform duration-200"
      >
        {/* Category tag */}
        {product.category && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#7DD3FC] mb-1 font-mono">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-[#FFFFFF] group-hover:text-[#7DD3FC] transition-colors line-clamp-1">
          <Link href={productUrl} prefetch={true} className="focus:outline-none hover:underline">
            {product.name}
          </Link>
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-[#9CAFC3] mt-2 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Variants count hint */}
        {product.variants && product.variants.length > 1 && (
          <div className="text-[11px] text-[#9CAFC3] mt-3 font-mono">
            {product.variants.length} options available
          </div>
        )}

        {/* Price & action footer */}
        <div className="mt-auto pt-4 border-t border-[#243447]/60 flex items-center justify-between">
          <PriceDisplay
            priceInr={product.price_inr}
            priceGbp={product.price_gbp}
            compareAtPriceInr={product.compare_at_price_inr}
            compareAtPriceGbp={product.compare_at_price_gbp}
            size="md"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist({ id: product.id, name: product.name });
              }}
              data-no-card-redirect="true"
              aria-label={isFav ? "Remove from wishlist" : "Save to wishlist"}
              title={isFav ? "In Wishlist (Click to remove)" : "Save to Wishlist"}
              className={`relative z-20 flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                isFav
                  ? "bg-red-950/80 border-red-500 text-red-400 shadow-md shadow-red-500/20"
                  : "bg-[#102A43] border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF] hover:border-[#7DD3FC]"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFav ? "fill-red-400 text-red-400 scale-110" : ""}`} />
            </button>

            <Link
              href={productUrl}
              prefetch={true}
              aria-label={`View ${product.name} details`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] group-hover:bg-[#7DD3FC] group-hover:text-[#080B10] group-hover:rotate-12 transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-[#7DD3FC]"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
