"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { PriceDisplay } from "./PriceDisplay";
import type { Product, ProductVariant, Category } from "@/lib/types/database";

interface ProductCardProps {
  product: Product & {
    variants?: ProductVariant[];
    category?: Category;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  // Compute overall inventory from variants or product
  const totalStock = product.variants?.reduce((sum, v) => sum + v.inventory_count, 0) ?? 10;
  const isOutOfStock = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  return (
    <div className="group relative flex flex-col rounded-xl bg-[#102A43]/50 border border-[#243447] hover:border-[#7DD3FC]/80 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#7DD3FC]/5">
      {/* Product Image Stage */}
      <div className="relative aspect-square w-full bg-[#080B10] flex items-center justify-center p-6 overflow-hidden border-b border-[#243447]">
        {/* Subtle geometric backdrop */}
        <div className="absolute inset-0 bg-radial from-[#102A43]/60 via-transparent to-transparent opacity-60 group-hover:scale-110 transition-transform duration-500"></div>

        {/* Minimalist product icon fallback / wireframe */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
          <div className="w-20 h-20 rounded-2xl bg-[#102A43] border border-[#243447] flex items-center justify-center text-[#7DD3FC] group-hover:border-[#7DD3FC] group-hover:scale-105 transition-all duration-300 shadow-inner">
            <span className="font-mono text-2xl font-bold">1</span>
          </div>
          <span className="text-[11px] font-mono text-[#9CAFC3] mt-3 uppercase tracking-widest">
            {product.sku}
          </span>
        </div>

        {/* Featured badge */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#7DD3FC] text-[#080B10] text-[10px] font-bold uppercase tracking-wider">
            Featured
          </div>
        )}

        {/* Stock status badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-400 border border-red-800">
              <XCircle className="h-3 w-3" /> Out of stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
              <AlertCircle className="h-3 w-3" /> Only {totalStock} left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#102A43] text-[#7DD3FC] border border-[#243447]">
              <CheckCircle2 className="h-3 w-3" /> In Stock
            </span>
          )}
        </div>
      </div>

      {/* Content details */}
      <div className="flex flex-col flex-1 p-5">
        {/* Category tag */}
        {product.category && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#7DD3FC] mb-1">
            {product.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base font-bold text-[#FFFFFF] group-hover:text-[#7DD3FC] transition-colors line-clamp-1">
          <Link href={`/products/${product.slug}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {product.name}
          </Link>
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-[#9CAFC3] mt-2 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Variants count hint */}
        {product.variants && product.variants.length > 1 && (
          <div className="text-[11px] text-[#9CAFC3] mt-3">
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

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#102A43] text-[#7DD3FC] border border-[#243447] group-hover:bg-[#7DD3FC] group-hover:text-[#080B10] transition-colors">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
