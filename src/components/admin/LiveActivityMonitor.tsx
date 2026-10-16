"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Activity,
  ShoppingBag,
  CreditCard,
  ShoppingCart,
  Globe,
  User,
  Search,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Headphones,
  Eye,
  AlertTriangle,
  Radio,
  WifiOff,
} from "lucide-react";
import type { ActivityEvent, ActivityEventType } from "@/lib/types/database";

interface LiveActivityMonitorProps {
  onOrderClick?: (orderNumber: string) => void;
  className?: string;
}

type ConnectionState = "connecting" | "connected" | "paused" | "reconnecting" | "error";

export function LiveActivityMonitor({ onOrderClick, className = "" }: LiveActivityMonitorProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [activeShoppers, setActiveShoppers] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [, setTick] = useState(0);

  const previousActivitiesRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  // Auto-tick relative timestamps every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 1000);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const fetchActivities = useCallback(async (isManual = false) => {
    try {
      if (isManual) {
        setConnectionState("reconnecting");
      }
      const res = await fetch("/api/admin/activity?limit=50");
      if (!res.ok) {
        if (isMountedRef.current) {
          setConnectionState("error");
        }
        return;
      }

      const data = await res.json();
      if (!isMountedRef.current) return;

      if (data.success && Array.isArray(data.activities)) {
        // Detect newly arrived events for visual indicator
        let freshCount = 0;
        data.activities.forEach((act: ActivityEvent) => {
          if (!previousActivitiesRef.current.has(act.id)) {
            freshCount++;
            previousActivitiesRef.current.add(act.id);
          }
        });

        if (freshCount > 0 && activities.length > 0) {
          setNewEventsCount((prev) => prev + freshCount);
          setTimeout(() => {
            if (isMountedRef.current) setNewEventsCount(0);
          }, 4000);
        }

        setActivities(data.activities);
        setActiveShoppers(typeof data.activeShoppersCount === "number" ? data.activeShoppersCount : 0);
        setLastRefreshed(new Date());
        setConnectionState(isLivePolling ? "connected" : "paused");
      } else {
        setConnectionState("error");
      }
    } catch {
      if (isMountedRef.current) {
        setConnectionState("error");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [activities.length, isLivePolling]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchActivities();

    if (!isLivePolling) {
      setConnectionState("paused");
      return;
    }

    const interval = setInterval(() => {
      fetchActivities();
    }, 4000); // Dynamic real-time poll every 4 seconds

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchActivities, isLivePolling]);

  const togglePolling = () => {
    if (isLivePolling) {
      setIsLivePolling(false);
      setConnectionState("paused");
    } else {
      setIsLivePolling(true);
      setConnectionState("reconnecting");
      fetchActivities(true);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "ORDERS") {
      return [
        "ORDER_CREATED",
        "ORDER_STATUS_CHANGED",
        "ORDER_FULFILLED",
        "ORDER_CANCELLED",
        "ORDER_REFUNDED",
      ].includes(act.type);
    }
    if (selectedFilter === "PAYMENTS") {
      return [
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
        "PAYMENT_PENDING",
        "PAYMENT_REFUNDED",
      ].includes(act.type);
    }
    if (selectedFilter === "CART") {
      return ["CART_ADD", "CART_REMOVE", "CART_UPDATED", "CART_CLEARED"].includes(act.type);
    }
    if (selectedFilter === "MARKET") {
      return act.type === "MARKET_SWITCH";
    }
    if (selectedFilter === "AUTH") {
      return ["CUSTOMER_LOGIN", "CUSTOMER_SIGNUP", "CUSTOMER_LOGOUT"].includes(act.type);
    }
    if (selectedFilter === "SUPPORT") {
      return act.type === "SUPPORT_INQUIRY";
    }
    if (selectedFilter === "BROWSING") {
      return act.type === "PRODUCT_VIEW" || act.type === "SEARCH_QUERY";
    }
    return true;
  });

  const getEventIcon = (type: ActivityEventType) => {
    switch (type) {
      case "ORDER_CREATED":
      case "ORDER_FULFILLED":
      case "ORDER_STATUS_CHANGED":
        return <ShoppingBag className="h-4 w-4 text-[#7DD3FC]" />;
      case "ORDER_CANCELLED":
      case "ORDER_REFUNDED":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "PAYMENT_SUCCESS":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "PAYMENT_FAILED":
        return <CreditCard className="h-4 w-4 text-rose-400" />;
      case "CART_ADD":
      case "CART_REMOVE":
      case "CART_UPDATED":
      case "CART_CLEARED":
        return <ShoppingCart className="h-4 w-4 text-amber-400" />;
      case "MARKET_SWITCH":
        return <Globe className="h-4 w-4 text-sky-400" />;
      case "CUSTOMER_LOGIN":
      case "CUSTOMER_SIGNUP":
      case "CUSTOMER_LOGOUT":
        return <User className="h-4 w-4 text-indigo-400" />;
      case "SUPPORT_INQUIRY":
        return <Headphones className="h-4 w-4 text-emerald-400" />;
      case "PRODUCT_VIEW":
        return <Eye className="h-4 w-4 text-sky-300" />;
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
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
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
              {connectionState === "connected" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  connectionState === "connected"
                    ? "bg-emerald-500"
                    : connectionState === "reconnecting"
                    ? "bg-amber-400 animate-pulse"
                    : connectionState === "error"
                    ? "bg-rose-500"
                    : "bg-zinc-600"
                }`}
              ></span>
            </span>
            <h3 className="text-base font-extrabold text-[#FFFFFF] tracking-tight flex items-center gap-2">
              <span>Dynamic User Activity Stream</span>
              {newEventsCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>+{newEventsCount} new event(s)</span>
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
            <div className="text-sm font-black text-[#7DD3FC]">
              {activeShoppers === null
                ? "Checking..."
                : activeShoppers === 1
                ? "1 shopper online"
                : `${activeShoppers} shoppers online`}
            </div>
          </div>

          {/* Genuine Connection State Pill */}
          <button
            type="button"
            onClick={togglePolling}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              connectionState === "connected"
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50"
                : connectionState === "reconnecting"
                ? "bg-amber-950/40 border-amber-500/50 text-amber-300"
                : connectionState === "error"
                ? "bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50"
                : "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
            }`}
          >
            {connectionState === "connected" ? (
              <>
                <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
                <span>Live Sync Active (4s)</span>
              </>
            ) : connectionState === "reconnecting" ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                <span>Reconnecting...</span>
              </>
            ) : connectionState === "error" ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-rose-400" />
                <span>Connection Lost (Retry)</span>
              </>
            ) : (
              <>
                <Activity className="h-3.5 w-3.5 text-zinc-400" />
                <span>Sync Paused</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fetchActivities(true)}
            className="p-1.5 rounded-xl bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC] text-[#9CAFC3] hover:text-[#FFFFFF] transition-all"
            title="Refresh now"
          >
            <RefreshCw className={`h-4 w-4 ${connectionState === "reconnecting" ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: "ALL", label: `All (${activities.length})` },
          { id: "ORDERS", label: "Orders" },
          { id: "PAYMENTS", label: "Payments" },
          { id: "SUPPORT", label: "Support Inquiries" },
          { id: "CART", label: "Cart Changes" },
          { id: "MARKET", label: "Market Switches" },
          { id: "AUTH", label: "Logins / Signups" },
          { id: "BROWSING", label: "Browsing & Searches" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 ${
              selectedFilter === tab.id
                ? "bg-[#7DD3FC] text-[#080B10]"
                : "bg-[#080B10] border border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#9CAFC3] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-[#7DD3FC]" />
            <span>Connecting to live store event stream...</span>
          </div>
        ) : connectionState === "error" && activities.length === 0 ? (
          <div className="py-10 text-center text-xs bg-rose-950/20 rounded-xl border border-rose-500/30 p-6 space-y-3">
            <WifiOff className="h-8 w-8 text-rose-400 mx-auto" />
            <div className="font-bold text-[#FFFFFF]">Activity Stream Connection Lost</div>
            <p className="text-rose-200/70 max-w-sm mx-auto">
              Unable to reach the live activity endpoint. Check your admin authorization or server connection.
            </p>
            <button
              onClick={() => fetchActivities(true)}
              className="px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-semibold"
            >
              Reconnect Now
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-xs bg-[#080B10]/40 rounded-xl border border-[#243447] p-8 space-y-2">
            <Activity className="h-8 w-8 text-[#9CAFC3]/40 mx-auto" />
            <div className="text-sm font-bold text-[#FFFFFF]">
              {selectedFilter === "ALL"
                ? "No live storefront activity recorded yet"
                : `No activity found under "${selectedFilter}"`}
            </div>
            <p className="text-xs text-[#9CAFC3] max-w-md mx-auto">
              {selectedFilter === "ALL"
                ? "Genuine live events will stream here automatically as shoppers browse, add items to cart, switch currencies between India (₹) and the UK (£), or complete checkouts."
                : "Switch filters or clear filter to view all store events."}
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const isOrder =
              act.type === "ORDER_CREATED" ||
              act.type === "ORDER_FULFILLED" ||
              act.type === "ORDER_STATUS_CHANGED" ||
              act.type === "PAYMENT_SUCCESS";

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
                      {Boolean(act.details?.trackingNumber) && (
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800">
                          Tracking: {String(act.details?.trackingNumber)}
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
        <span className="text-[#7DD3FC] flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <span>Genuine operational event telemetry</span>
        </span>
      </div>
    </div>
  );
}
