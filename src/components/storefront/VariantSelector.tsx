"use client";

import { useMarket } from "@/lib/context/MarketContext";
import type { ProductVariant } from "@/lib/types/database";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelectVariant,
}: VariantSelectorProps) {
  const { market } = useMarket();

  if (!variants || variants.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#FFFFFF] uppercase tracking-wider">
          Select Variant / Option:
        </span>
        {selectedVariant && (
          <span className="text-[#7DD3FC] font-medium font-mono">{selectedVariant.sku}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {variants.map((v) => {
          const isSelected = selectedVariant?.id === v.id;
          const isOutOfStock = v.inventory_count <= 0;
          const priceAdj =
            market === "IN"
              ? v.price_inr_adjustment
              : v.price_gbp_adjustment;

          const adjSign = priceAdj > 0 ? `+` : ``;
          const adjLabel =
            priceAdj !== 0
              ? ` (${adjSign}${market === "IN" ? "₹" : "£"}${Math.abs(priceAdj)})`
              : "";

          return (
            <button
              key={v.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onSelectVariant(v)}
              className={`p-3 rounded-lg text-left text-xs border transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-[#102A43] border-[#7DD3FC] text-[#FFFFFF] shadow-sm shadow-[#7DD3FC]/10"
                  : isOutOfStock
                  ? "bg-[#080B10]/60 border-[#243447]/40 text-[#9CAFC3]/50 cursor-not-allowed opacity-60"
                  : "bg-[#102A43]/40 border-[#243447] text-[#9CAFC3] hover:border-[#9CAFC3] hover:text-[#FFFFFF]"
              }`}
            >
              <div>
                <div className="font-semibold text-[#FFFFFF]">{v.name}</div>
                <div className="text-[10px] text-[#9CAFC3] mt-0.5">
                  {isOutOfStock ? (
                    <span className="text-red-400">Out of Stock</span>
                  ) : v.inventory_count <= v.low_stock_threshold ? (
                    <span className="text-amber-400">Low Stock: {v.inventory_count} left</span>
                  ) : (
                    <span className="text-[#7DD3FC]">{v.inventory_count} available</span>
                  )}
                </div>
              </div>
              {adjLabel && <span className="font-mono text-[11px] text-[#7DD3FC]">{adjLabel}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
