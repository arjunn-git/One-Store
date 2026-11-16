"use client";

import { useMarket } from "@/lib/context/MarketContext";

interface PriceDisplayProps {
  priceInr: number;
  priceGbp?: number;
  compareAtPriceInr?: number | null;
  compareAtPriceGbp?: number | null;
  adjustmentInr?: number;
  adjustmentGbp?: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function PriceDisplay({
  priceInr,
  compareAtPriceInr,
  adjustmentInr = 0,
  className = "",
  size = "md",
}: PriceDisplayProps) {
  const finalPrice = priceInr + adjustmentInr;
  const currentFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(finalPrice);

  let compareFormatted: string | null = null;
  let discountPercent = 0;

  if (compareAtPriceInr && compareAtPriceInr > finalPrice) {
    compareFormatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(compareAtPriceInr + adjustmentInr);
    discountPercent = Math.round(
      ((compareAtPriceInr - finalPrice) / compareAtPriceInr) * 100
    );
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-base font-semibold",
    lg: "text-xl font-bold",
    xl: "text-3xl font-extrabold",
  };

  return (
    <div className={`flex items-baseline gap-2.5 flex-wrap ${className}`}>
      <span className={`${textSizes[size]} text-[#FFFFFF] tracking-tight font-mono`}>
        {currentFormatted}
      </span>
      {compareFormatted && (
        <>
          <span className="text-xs text-[#94A3B8] line-through font-mono">{compareFormatted}</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30">
            Save {discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
