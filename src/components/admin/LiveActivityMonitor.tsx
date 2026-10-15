"use client";

import { useEffect, useState, useRef } from "react";
import {
  Activity,
  ShoppingBag,
  CreditCard,
  ShoppingCart,
  Globe,
  User,
  Search,
  RefreshCw,
  Bell,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { ActivityEvent, ActivityEventType } from "@/lib/types/database";

interface LiveActivityMonitorProps {
  onOrderClick?: (orderNumber: string) => void;
  className?: string;
}

export function LiveActivityMonitor({ onOrderClick, className = "" }: LiveActivityMonitorProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [activeShoppers, setActiveShoppers] = useState(1);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newEventsCount, setNewEventsCount] = useState(0);
  const previousActivitiesRef = useRef<Set<string>>(new Set());

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/admin/activity?limit=30");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.activities)) {
        // Detect newly arrived events for visual pulse
        let freshCount = 0;
        data.activities.forEach((act: ActivityEvent) => {
          if (!previousActivitiesRef.current.has(act.id)) {
            freshCount++;
            previousActivitiesRef.current.add(act.id);
          }
        });

        if (freshCount > 0 && activities.length > 0) {
          setNewEventsCount((prev) => prev + freshCount);
          setTimeout(() => setNewEventsCount(0), 4000);
        }

        setActivities(data.activities);
        if (data.activeShoppersCount) {
          setActiveShoppers(data.activeShoppersCount);
        }
        setLastRefreshed(new Date());
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    if (!isLivePolling) return;

    const interval = setInterval(() => {
      fetchActivities();
    }, 4000); // Dynamic update every 4 seconds

    return () => clearInterval(interval);
  }, [isLivePolling]);

  const filteredActivities = activities.filter((act) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "ORDERS") return act.type === "ORDER_CREATED";
    if (selectedFilter === "PAYMENTS") return act.type === "PAYMENT_SUCCESS" || act.type === "PAYMENT_FAILED";
    if (selectedFilter === "CART") return act.type === "CART_ADD" || act.type === "CART_REMOVE";
    if (selectedFilter === "MARKET") return act.type === "MARKET_SWITCH";
    if (selectedFilter === "AUTH") return act.type === "CUSTOMER_LOGIN" || act.type === "CUSTOMER_SIGNUP";
    return true;
  });

  const getEventIcon = (type: ActivityEventType) => {
    switch (type) {
      case "ORDER_CREATED":
        return <ShoppingBag className="h-4 w-4 text-[#7DD3FC]" />;
      case "PAYMENT_SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "PAYMENT_FAILED":
        return <CreditCard className="h-4 w-4 text-rose-400" />;
      case "CART_ADD":
      case "CART_REMOVE":
        return <ShoppingCart className="h-4 w-4 text-amber-400" />;
      case "MARKET_SWITCH":
        return <Globe className="h-4 w-4 text-sky-400" />;
      case "CUSTOMER_LOGIN":
      case "CUSTOMER_SIGNUP":
        return <User className="h-4 w-4 text-indigo-400" />;
      case "SEARCH_QUERY":
        return <Search className="h-4 w-4 text-[#9CAFC3]" />;
      default:
        return <Activity className="h-4 w-4 text-[#7DD3FC]" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 10) return "Just now";
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className={`rounded-2xl bg-[#102A43]/40 border border-[#243447] p-6 space-y-6 shadow-xl ${className}`}>
      {/* Top Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {isLivePolling && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLivePolling ? "bg-emerald-500" : "bg-zinc-600"
                }`}
              ></span>
            </span>
            <h3 className="text-base font-extrabold text-[#FFFFFF] tracking-tight flex items-center gap-2">
              <span>Dynamic User Activity Stream</span>
              {newEventsCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>+{newEventsCount} live event(s)</span>
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-[#9CAFC3]">
            Streaming live storefront interactions, carts, checkouts, and multi-market transactions across India &amp; United Kingdom.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-[#9CAFC3] uppercase tracking-wider">Active Visitors</div>
            <div className="text-sm font-black text-[#7DD3FC]">{activeShoppers} shopper(s) online</div>
          </div>

          <button
            type="button"
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isLivePolling
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50"
                : "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
            }`}
          >
            <Activity className={`h-3.5 w-3.5 ${isLivePolling ? "animate-pulse text-emerald-400" : ""}`} />
            <span>{isLivePolling ? "Live Sync ON" : "Paused"}</span>
          </button>

          <button
            type="button"
            onClick={fetchActivities}
            className="p-1.5 rounded-xl bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC] text-[#9CAFC3] hover:text-[#FFFFFF] transition-all"
            title="Refresh now"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {["ALL", "ORDERS", "PAYMENTS", "CART", "MARKET", "AUTH"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedFilter(tab)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 ${
              selectedFilter === tab
                ? "bg-[#7DD3FC] text-[#080B10]"
                : "bg-[#080B10] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
            }`}
          >
            {tab === "ALL" && `All (${activities.length})`}
            {tab === "ORDERS" && "Orders"}
            {tab === "PAYMENTS" && "Payments"}
            {tab === "CART" && "Cart Changes"}
            {tab === "MARKET" && "Market Switches"}
            {tab === "AUTH" && "Logins / Signups"}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#9CAFC3] flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-[#7DD3FC]" />
            <span>Connecting to live activity stream...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9CAFC3] bg-[#080B10]/40 rounded-xl border border-[#243447]">
            No activity matching the selected filter.
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isOrder = act.type === "ORDER_CREATED" || act.type === "PAYMENT_SUCCESS";
            return (
              <div
                key={act.id}
                onClick={() => {
                  if (act.details?.orderNumber && onOrderClick) {
                    onOrderClick(String(act.details.orderNumber));
                  }
                }}
                className={`p-3.5 rounded-xl bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC]/60 transition-all flex items-start justify-between gap-3 ${
                  isOrder ? "cursor-pointer hover:bg-[#102A43]/30" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-[#102A43] border border-[#243447] flex items-center justify-center shrink-0 mt-0.5">
                    {getEventIcon(act.type)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#FFFFFF]">{act.action}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          act.market === "GB"
                            ? "bg-blue-500/10 text-sky-300 border-blue-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {act.market === "GB" ? "UK (£ GBP)" : "India (₹ INR)"}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#9CAFC3] flex items-center gap-2 flex-wrap">
                      <span className="text-[#7DD3FC]">{act.actor}</span>
                      {Boolean(act.details?.orderNumber) && (
                        <span className="font-mono text-[#FFFFFF] bg-[#102A43] px-1.5 py-0.5 rounded border border-[#243447]">
                          {String(act.details?.orderNumber)}
                        </span>
                      )}
                      {Boolean(act.details?.totalAmount) && (
                        <span className="font-semibold text-emerald-400">
                          {act.currency === "INR"
                            ? `₹${Number(act.details?.totalAmount).toLocaleString("en-IN")}`
                            : `£${Number(act.details?.totalAmount).toFixed(2)}`}
                        </span>
                      )}
                      {Boolean(act.details?.productName) && (
                        <span className="text-[#9CAFC3] italic">
                          &ldquo;{String(act.details?.productName)}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-[#9CAFC3] block">
                    {formatRelativeTime(act.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-[#9CAFC3] pt-2 border-t border-[#243447]/60">
        <span>Updated: {lastRefreshed.toLocaleTimeString()}</span>
        <span className="text-[#7DD3FC]">Real-time operational event bus connected</span>
      </div>
    </div>
  );
}
