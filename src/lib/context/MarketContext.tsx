"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { BRAND, type SupportedMarket, type SupportedCurrency } from "@/lib/constants/brand";
import { getOrCreateAnonymousSessionId, pingSessionHeartbeat, getClientActor } from "@/lib/services/session";

interface MarketContextValue {
  market: SupportedMarket;
  currency: SupportedCurrency;
  currencySymbol: string;
  setMarket: (market: SupportedMarket) => void;
  formatPrice: (
    inr: number,
    gbp: number,
    adjInr?: number,
    adjGbp?: number
  ) => {
    current: string;
    raw: number;
    compareAt?: string;
  };
}

const MarketContext = createContext<MarketContextValue | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarketState] = useState<SupportedMarket>("IN");

  useEffect(() => {
    // Check saved market in localStorage or cookie
    const saved = localStorage.getItem("one_store_market") as SupportedMarket;
    const currentMarket = saved && (saved === "IN" || saved === "GB") ? saved : "IN";
    if (saved && (saved === "IN" || saved === "GB")) {
      setMarketState(saved);
    }

    // Ping real session heartbeat
    pingSessionHeartbeat(currentMarket);
    const interval = setInterval(() => {
      pingSessionHeartbeat(currentMarket);
    }, 4 * 60 * 1000); // Heartbeat every 4 minutes

    return () => clearInterval(interval);
  }, []);

  const setMarket = (newMarket: SupportedMarket) => {
    if (newMarket === market) return;
    const previousMarket = market;
    setMarketState(newMarket);

    try {
      localStorage.setItem("one_store_market", newMarket);
      document.cookie = `one_store_market=${newMarket}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage errors in private browsing
    }

    // Emit genuine MARKET_SWITCH activity event
    try {
      const sessionId = getOrCreateAnonymousSessionId();
      const realActor = getClientActor(newMarket);
      fetch("/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          type: "MARKET_SWITCH",
          action: `Market Switched to ${newMarket === "GB" ? "United Kingdom (£ GBP)" : "India (₹ INR)"}`,
          actor: realActor,
          market: newMarket,
          currency: newMarket === "GB" ? "GBP" : "INR",
          resourceType: "storefront",
          anonymousSessionId: sessionId,
          details: {
            previousMarket,
            newMarket,
            currency: newMarket === "GB" ? "GBP (£)" : "INR (₹)",
          },
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Non-blocking
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("one_store_market_change", { detail: { market: newMarket } }));
    }
  };

  const currency: SupportedCurrency = BRAND.markets[market].currency;
  const currencySymbol = BRAND.markets[market].symbol;

  const formatPrice = (
    inr: number,
    gbp: number,
    adjInr: number = 0,
    adjGbp: number = 0
  ) => {
    if (market === "IN") {
      const finalPrice = inr + adjInr;
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(finalPrice);

      return {
        current: formatted,
        raw: finalPrice,
      };
    } else {
      const finalPrice = gbp + adjGbp;
      const formatted = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
      }).format(finalPrice);

      return {
        current: formatted,
        raw: finalPrice,
      };
    }
  };

  return (
    <MarketContext.Provider
      value={{
        market,
        currency,
        currencySymbol,
        setMarket,
        formatPrice,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
}
