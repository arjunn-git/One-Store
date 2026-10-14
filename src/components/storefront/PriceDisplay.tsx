"use client";

import { useMarket } from "@/lib/context/MarketContext";

interface PriceDisplayProps {
  priceInr: number;
  priceGbp: number;
  compareAtPriceInr?: number | null;
  compareAtPriceGbp?: number | null;
  adjustmentInr?: number;
  adjustmentGbp?: number;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function PriceDisplay({
  priceInr,
  priceGbp,
  compareAtPriceInr,
  compareAtPriceGbp,
  adjustmentInr = 0,
  adjustmentGbp = 0,
  className = "",
  size = "md",
}: PriceDisplayProps) {
  const { market, formatPrice } = useMarket();

  const current = formatPrice(priceInr, priceGbp, adjustmentInr, adjustmentGbp);

  let compareFormatted: string | null = null;
  let discountPercent = 0;

  if (market === "IN" && compareAtPriceInr && compareAtPriceInr > priceInr + adjustmentInr) {
    compareFormatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(compareAtPriceInr + adjustmentInr);
    discountPercent = Math.round(
      ((compareAtPriceInr - (priceInr + adjustmentInr)) / compareAtPriceInr) * 100
    );
  } else if (market === "GB" && compareAtPriceGbp && compareAtPriceGbp > priceGbp + adjustmentGbp) {
    compareFormatted = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(compareAtPriceGbp + adjustmentGbp);
    discountPercent = Math.round(
      ((compareAtPriceGbp - (priceGbp + adjustmentGbp)) / compareAtPriceGbp) * 100
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
      <span className={`${textSizes[size]} text-[#FFFFFF] tracking-tight`}>
        {current.current}
      </span>
      {compareFormatted && (
        <>
          <span className="text-xs text-[#9CAFC3] line-through">{compareFormatted}</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30">
            Save {discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
