"use client";

import { useMarket } from "@/lib/context/MarketContext";
import { MARKETS_CONFIG } from "@/lib/config/market";
import { Truck } from "lucide-react";

interface CountrySelectorProps {
  compact?: boolean;
  className?: string;
}

export function CountrySelector({ compact = false, className = "" }: CountrySelectorProps) {
  const { market } = useMarket();
  const currentConfig = MARKETS_CONFIG[market] || MARKETS_CONFIG.IN;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className={`flex items-center gap-2 rounded-xl border border-[#243447] bg-[#0c131c]/90 text-xs font-medium text-[#FFFFFF] shadow-sm select-none transition-colors hover:border-[#7DD3FC]/60 ${
          compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
        }`}
        title="India Store • All-India Express Delivery via Blue Dart & Delhivery"
      >
        <span className="text-base leading-none" role="img" aria-label="India">
          {currentConfig.flagEmoji}
        </span>
        <span className="font-semibold text-[#FFFFFF]">{currentConfig.name}</span>
        <span className="text-[#7DD3FC] font-mono font-bold">
          ({currentConfig.currencySymbol} {currentConfig.currency})
        </span>
        <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-full font-medium ml-1">
          <Truck className="h-3 w-3" />
          <span>Free &gt; ₹1,999</span>
        </span>
      </div>
    </div>
  );
}
