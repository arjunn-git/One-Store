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
    gbp?: number,
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
    // Only India is active
    try {
      localStorage.setItem("one_store_market", "IN");
      document.cookie = "one_store_market=IN; path=/; max-age=31536000; SameSite=Lax";
    } catch {
      // Ignore storage errors
    }

    // Ping session heartbeat for India
    pingSessionHeartbeat("IN");
    const interval = setInterval(() => {
      pingSessionHeartbeat("IN");
    }, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const setMarket = (_newMarket: SupportedMarket) => {
    // Single market mode: always maintain IN
    setMarketState("IN");
  };

  const currency: SupportedCurrency = "INR";
  const currencySymbol = "₹";

  const formatPrice = (
    inr: number,
    _gbp?: number,
    adjInr: number = 0,
    _adjGbp: number = 0
  ) => {
    const finalPrice = inr + (adjInr || 0);
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(finalPrice);

    return {
      current: formatted,
      raw: finalPrice,
    };
  };

  return (
    <MarketContext.Provider
      value={{
        market: "IN",
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
