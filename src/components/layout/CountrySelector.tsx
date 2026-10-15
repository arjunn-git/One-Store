"use client";

import { useState, useRef, useEffect } from "react";
import { useMarket } from "@/lib/context/MarketContext";
import { MARKETS_CONFIG, type MarketCode } from "@/lib/config/market";
import { ChevronDown, Check, Globe } from "lucide-react";

interface CountrySelectorProps {
  compact?: boolean;
  className?: string;
}

export function CountrySelector({ compact = false, className = "" }: CountrySelectorProps) {
  const { market, setMarket } = useMarket();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentConfig = MARKETS_CONFIG[market];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  };

  const selectMarket = (code: MarketCode) => {
    setIsOpen(false);
    if (code === market) return;
    try {
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MARKET_SWITCH",
          action: `Switched store to ${code === "GB" ? "United Kingdom (£ GBP)" : "India (₹ INR)"}`,
          market: code,
          currency: code === "GB" ? "GBP" : "INR",
          resourceType: "storefront",
          details: { previousMarket: market, newMarket: code },
        }),
      }).catch(() => {});
    } catch {
      // Ignored
    }
    setMarket(code);
  };

  const marketOptions: MarketCode[] = ["IN", "GB"];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select shipping country and currency. Currently selected: ${currentConfig.name} (${currentConfig.currencySymbol} ${currentConfig.currency})`}
        className={`flex items-center gap-2 rounded-lg border border-[#243447] bg-[#0c131c] text-xs font-medium text-[#FFFFFF] hover:border-[#7DD3FC] hover:bg-[#102A43] transition-all focus:outline-none focus:ring-1 focus:ring-[#7DD3FC] ${
          compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5"
        }`}
      >
        <span className="text-sm leading-none" role="img" aria-label={currentConfig.name}>
          {currentConfig.flagEmoji}
        </span>
        <span className="font-semibold text-[#FFFFFF]">{currentConfig.name}</span>
        <span className="text-[#7DD3FC] font-mono">
          ({currentConfig.currencySymbol} {currentConfig.currency})
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#9CAFC3] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#7DD3FC]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available Markets"
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-xl border border-[#243447] bg-[#080B10] shadow-2xl backdrop-blur-md z-50 overflow-hidden divide-y divide-[#243447]/60 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-3 bg-[#0c131c]/80 text-[11px] text-[#9CAFC3]">
            <div className="flex items-center gap-1.5 font-semibold text-[#FFFFFF] uppercase tracking-wider text-[10px]">
              <Globe className="h-3.5 w-3.5 text-[#7DD3FC]" />
              <span>Select Destination Market</span>
            </div>
            <p className="mt-1 text-[10px] text-[#9CAFC3]">
              Prices, shipping rates, and catalogue inventory adapt seamlessly to your region.
            </p>
          </div>

          <div className="p-1.5 space-y-1">
            {marketOptions.map((code) => {
              const cfg = MARKETS_CONFIG[code];
              const isSelected = market === code;

              return (
                <button
                  key={code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectMarket(code)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all ${
                    isSelected
                      ? "bg-[#102A43] text-[#FFFFFF] border border-[#7DD3FC]/40"
                      : "text-[#9CAFC3] hover:bg-[#102A43]/50 hover:text-[#FFFFFF]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl" role="img" aria-label={cfg.name}>
                      {cfg.flagEmoji}
                    </span>
                    <div>
                      <div className="font-bold text-[#FFFFFF] flex items-center gap-2">
                        <span>{cfg.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#080B10] text-[#7DD3FC] border border-[#243447]">
                          {cfg.currencySymbol} {cfg.currency}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#9CAFC3] mt-0.5">
                        {code === "IN"
                          ? "Blue Dart / Delhivery Express • GST Inclusive"
                          : "Royal Mail Tracked 24/48 • UK VAT Inclusive"}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-[#7DD3FC] text-[#080B10] flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2.5 bg-[#0c131c]/50 text-[10px] text-[#9CAFC3] flex items-center justify-between">
            <span>Free delivery:</span>
            <span className="font-semibold text-[#7DD3FC]">
              {market === "IN" ? "Above ₹1,999" : "Above £50.00"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
