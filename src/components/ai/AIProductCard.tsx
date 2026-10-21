"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag, ArrowUpRight } from "lucide-react";
import { useCart } from "@/lib/context/CartContext";
import type { AIProductRecommendation } from "@/lib/types/ai";
import type { Product } from "@/lib/types/database";

interface AIProductCardProps {
  product: AIProductRecommendation;
  onNavigate?: () => void;
}

export function AIProductCard({ product, onNavigate }: AIProductCardProps) {
  const { addItem, setIsOpen } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productPayload: Product = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: "",
      category_id: "",
      images: product.imageUrl ? [product.imageUrl] : [],
      price_inr: product.priceInr,
      price_gbp: product.priceGbp,
      sku: product.sku,
      status: "active",
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addItem(productPayload, null, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#080B10]/80 border border-[#243447] hover:border-[#7DD3FC]/50 transition-all text-xs group">
      {/* Product Image Thumbnail */}
      <Link
        href={`/products/${product.slug}`}
        onClick={onNavigate}
        className="relative h-14 w-14 rounded-lg overflow-hidden bg-[#102A43] border border-[#243447] shrink-0 flex items-center justify-center"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <span className="font-mono text-sm font-bold text-[#7DD3FC]">1</span>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-[10px] text-[#7DD3FC] font-mono truncate">
          {product.categoryName}
        </div>
        <Link
          href={`/products/${product.slug}`}
          onClick={onNavigate}
          className="font-bold text-[#FFFFFF] hover:text-[#7DD3FC] transition-colors truncate block text-sm sm:text-xs"
          title={product.name}
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-semibold text-sm sm:text-xs text-[#FFFFFF]">{product.formattedPrice}</span>
          {product.compareAtFormattedPrice && (
            <span className="text-xs sm:text-[10px] text-[#9CAFC3] line-through">
              {product.compareAtFormattedPrice}
            </span>
          )}
          <span
            className={`text-xs sm:text-[10px] px-2 py-0.5 rounded font-medium ${
              product.inStock
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                : "bg-red-950/60 text-red-400 border border-red-800/60"
            }`}
          >
            {product.inStock ? "In Stock" : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1 shrink-0">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.inStock || added}
          className={`flex items-center justify-center h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
            added
              ? "bg-emerald-500 text-[#080B10]"
              : "bg-[#7DD3FC] text-[#080B10] hover:bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
          title="Add to Shopping Cart"
        >
          {added ? (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 stroke-[2.5]" /> Added
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" /> Add
            </span>
          )}
        </button>

        <Link
          href={`/products/${product.slug}`}
          onClick={onNavigate}
          className="flex items-center justify-center h-6 px-2 rounded-lg bg-[#102A43] hover:bg-[#102A43]/80 text-[#9CAFC3] hover:text-[#FFFFFF] text-[10px] font-medium border border-[#243447] transition-all"
          title="View full specs"
        >
          <span>View</span>
          <ArrowUpRight className="h-3 w-3 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}
