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
import { CreepyAttractiveBotIcon } from "@/components/ai/CreepyAttractiveBotIcon";
import type { ActivityEvent, ActivityEventType } from "@/lib/types/database";

interface LiveActivityMonitorProps {
  onOrderClick?: (orderNumber: string) => void;
  className?: string;
}

type ConnectionState = "connecting" | "connected" | "paused" | "reconnecting" | "error";

interface ActivityCounts {
  total: number;
  orders: number;
  payments: number;
  cart: number;
  marketSwitches: number;
  auth: number;
  support: number;
  product: number;
}

const FILTER_LABELS: Record<string, string> = {
  ALL: "All Activities",
  ORDERS: "Orders",
  PAYMENTS: "Payments",
  SUPPORT: "Support Inquiries",
  CART: "Cart Changes",
  MARKET: "Market Switches",
  AUTH: "Logins / Signups",
  BROWSING: "Browsing & Searches",
  AI: "Nocturne AI Assistant",
};

export function LiveActivityMonitor({ onOrderClick, className = "" }: LiveActivityMonitorProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [counts, setCounts] = useState<ActivityCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [activeShoppers, setActiveShoppers] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [newEventsCount, setNewEventsCount] = useState(0);
  const [testingEvent, setTestingEvent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  const previousActivitiesRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);
  const hasInitialFetchRef = useRef(false);

  // Set mounted flag on client
  useEffect(() => {
    setMounted(true);
  }, []);

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

        if (freshCount > 0 && hasInitialFetchRef.current) {
          setNewEventsCount((prev) => prev + freshCount);
          setTimeout(() => {
            if (isMountedRef.current) setNewEventsCount(0);
          }, 4000);
        }
        hasInitialFetchRef.current = true;

        setActivities(data.activities);
        if (data.counts) {
          setCounts(data.counts);
        }
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
  }, [isLivePolling]);

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
    if (selectedFilter === "AI") {
      return ["AI_ASSISTANT_QUERY", "AI_RECOMMENDATION_CLICK", "AI_ADD_TO_CART"].includes(act.type);
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
      case "AI_ASSISTANT_QUERY":
      case "AI_RECOMMENDATION_CLICK":
      case "AI_ADD_TO_CART":
        return <CreepyAttractiveBotIcon size="sm" />;
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
    <div className={`rounded-2xl bg-[#0C131C] border border-[#243447]/80 p-5 sm:p-6 space-y-5 shadow-xl ${className}`}>
      {/* Top Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447]/60 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 shrink-0">
              {connectionState === "connected" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  connectionState === "connected"
                    ? "bg-emerald-400"
                    : connectionState === "reconnecting"
                    ? "bg-amber-400"
                    : connectionState === "error"
                    ? "bg-rose-400"
                    : "bg-zinc-500"
                }`}
              ></span>
            </span>
            <h3 className="text-base font-bold text-[#FFFFFF] tracking-tight flex items-center gap-2">
              <span>Dynamic User Activity Stream</span>
              {newEventsCount > 0 && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>+{newEventsCount} new</span>
                </span>
              )}
            </h3>
          </div>
          <p className="text-xs text-[#9CAFC3]">
            Streaming live storefront checkouts, cart interactions, and dual-market sessions across India &amp; United Kingdom.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-[#9CAFC3] uppercase tracking-wider font-medium">Active Visitors</div>
            <div className="text-xs font-semibold text-[#7DD3FC]" suppressHydrationWarning>
              {!mounted
                ? "Connecting..."
                : activeShoppers === null
                ? "Connecting..."
                : activeShoppers === 1
                ? "1 shopper online"
                : `${activeShoppers} shoppers online`}
            </div>
          </div>

          {/* Genuine Connection State Pill */}
          <button
            type="button"
            onClick={togglePolling}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              connectionState === "connected"
                ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/50"
                : connectionState === "reconnecting"
                ? "bg-amber-950/30 border-amber-800/40 text-amber-300"
                : connectionState === "error"
                ? "bg-rose-950/30 border-rose-800/40 text-rose-300 hover:bg-rose-950/50"
                : "bg-[#080B10] border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
            }`}
          >
            {connectionState === "connected" ? (
              <>
                <Radio className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Live Sync Active (4s)</span>
              </>
            ) : connectionState === "reconnecting" ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" />
                <span>Reconnecting...</span>
              </>
            ) : connectionState === "error" ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span>Connection Lost (Retry)</span>
              </>
            ) : (
              <>
                <Activity className="h-3.5 w-3.5 text-[#9CAFC3] shrink-0" />
                <span>Sync Paused</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fetchActivities(true)}
            className="p-1.5 rounded-lg bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC]/50 text-[#9CAFC3] hover:text-[#FFFFFF] transition-colors"
            title="Refresh now"
            aria-label="Refresh activity feed"
          >
            <RefreshCw className={`h-4 w-4 ${connectionState === "reconnecting" ? "animate-spin text-[#7DD3FC]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {[
          { id: "ALL", label: `All (${activities.length})` },
          {
            id: "ORDERS",
            label: `Orders (${counts?.orders ?? activities.filter((a) => ["ORDER_CREATED", "ORDER_STATUS_CHANGED", "ORDER_FULFILLED", "ORDER_CANCELLED", "ORDER_REFUNDED"].includes(a.type)).length})`,
          },
          {
            id: "PAYMENTS",
            label: `Payments (${counts?.payments ?? activities.filter((a) => ["PAYMENT_SUCCESS", "PAYMENT_FAILED", "PAYMENT_PENDING", "PAYMENT_REFUNDED"].includes(a.type)).length})`,
          },
          {
            id: "SUPPORT",
            label: `Support Inquiries (${counts?.support ?? activities.filter((a) => a.type === "SUPPORT_INQUIRY").length})`,
          },
          {
            id: "CART",
            label: `Cart Changes (${counts?.cart ?? activities.filter((a) => ["CART_ADD", "CART_REMOVE", "CART_UPDATED", "CART_CLEARED"].includes(a.type)).length})`,
          },
          {
            id: "MARKET",
            label: `Market Switches (${counts?.marketSwitches ?? activities.filter((a) => a.type === "MARKET_SWITCH").length})`,
          },
          {
            id: "AUTH",
            label: `Logins / Signups (${counts?.auth ?? activities.filter((a) => ["CUSTOMER_LOGIN", "CUSTOMER_SIGNUP", "CUSTOMER_LOGOUT"].includes(a.type)).length})`,
          },
          {
            id: "BROWSING",
            label: `Browsing & Searches (${counts?.product ?? activities.filter((a) => a.type === "PRODUCT_VIEW" || a.type === "SEARCH_QUERY").length})`,
          },
          {
            id: "AI",
            label: `AI Assistant (${activities.filter((a) => ["AI_ASSISTANT_QUERY", "AI_RECOMMENDATION_CLICK", "AI_ADD_TO_CART"].includes(a.type)).length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              selectedFilter === tab.id
                ? "bg-[#7DD3FC]/10 text-[#7DD3FC] border border-[#7DD3FC]/30 shadow-sm font-semibold"
                : "bg-[#080B10]/70 border border-[#243447]/80 text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#9CAFC3] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-[#7DD3FC]" />
            <span>Connecting to live store event stream...</span>
          </div>
        ) : connectionState === "error" && activities.length === 0 ? (
          <div className="py-10 text-center text-xs bg-rose-950/20 rounded-xl border border-rose-500/30 p-6 space-y-3">
            <WifiOff className="h-7 w-7 text-rose-400 mx-auto" />
            <div className="font-semibold text-[#FFFFFF]">Activity Stream Connection Lost</div>
            <p className="text-rose-200/70 max-w-sm mx-auto">
              Unable to reach the live activity endpoint. Check your admin authorization or server connection.
            </p>
            <button
              onClick={() => fetchActivities(true)}
              className="px-4 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-medium"
            >
              Reconnect Now
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-xs bg-[#080B10]/40 rounded-xl border border-[#243447]/80 p-8 space-y-3">
            <Activity className="h-7 w-7 text-[#9CAFC3]/40 mx-auto" />
            <div className="text-sm font-semibold text-[#FFFFFF]">
              {selectedFilter === "ALL"
                ? "No live storefront activity recorded yet"
                : `No activity found under "${FILTER_LABELS[selectedFilter] || selectedFilter}"`}
            </div>
            <p className="text-xs text-[#9CAFC3] max-w-md mx-auto">
              {selectedFilter === "ALL"
                ? "Genuine live events will stream here automatically as shoppers browse, add items to cart, switch currencies between India (₹) and the UK (£), or complete checkouts."
                : `Genuine ${FILTER_LABELS[selectedFilter] || selectedFilter} events will stream here automatically when shoppers perform this action on the store.`}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              {selectedFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter("ALL")}
                  className="px-3 py-1.5 rounded-lg bg-[#080B10] border border-[#243447] text-[#7DD3FC] hover:bg-[#102A43] text-xs font-medium transition-colors"
                >
                  View All Store Events ({activities.length})
                </button>
              )}
              {selectedFilter === "MARKET" && (
                <button
                  type="button"
                  disabled={testingEvent}
                  onClick={async () => {
                    setTestingEvent(true);
                    try {
                      await fetch("/api/activity", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: "MARKET_SWITCH",
                          action: "Market Switched to United Kingdom (£ GBP)",
                          actor: "Admin Operator (onestore.auth@gmail.com)",
                          market: "GB",
                          currency: "GBP",
                          resourceType: "storefront",
                          details: { previousMarket: "IN", newMarket: "GB", currency: "GBP (£)" },
                        }),
                      });
                      await fetchActivities(true);
                    } finally {
                      setTestingEvent(false);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#7DD3FC] text-[#080B10] hover:bg-[#FFFFFF] text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{testingEvent ? "Emitting..." : "Test Market Switch Event (IN ⇄ GB)"}</span>
                </button>
              )}
            </div>
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
                className={`p-3 rounded-xl bg-[#080B10]/70 border border-[#243447]/80 hover:border-[#243447] transition-colors flex items-start justify-between gap-3 ${
                  isOrder ? "cursor-pointer hover:bg-[#102A43]/20" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-[#102A43]/50 border border-[#243447] flex items-center justify-center shrink-0 mt-0.5">
                    {getEventIcon(act.type)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#FFFFFF]">{act.action}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          act.market === "GB"
                            ? "bg-sky-950/40 text-sky-300 border-sky-800/50"
                            : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                        }`}
                      >
                        {act.market === "GB" ? "UK (£ GBP)" : "India (₹ INR)"}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#9CAFC3] flex items-center gap-2 flex-wrap">
                      <span className="text-[#7DD3FC] font-medium">{act.actor}</span>
                      {Boolean(act.details?.orderNumber) && (
                        <span className="font-mono text-[#FFFFFF] bg-[#102A43]/60 px-1.5 py-0.5 rounded border border-[#243447]">
                          {String(act.details?.orderNumber)}
                        </span>
                      )}
                      {Boolean(act.details?.totalAmount) && (
                        <span className="font-medium text-emerald-400">
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
                        <span className="text-[10px] font-mono text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/50">
                          Tracking: {String(act.details?.trackingNumber)}
                        </span>
                      )}
                      {Boolean(act.details?.feedback) && (
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/50">
                          Feedback: {String(act.details?.feedback)}
                        </span>
                      )}
                    </div>

                    {Boolean(act.details?.userMessage) && (
                      <div className="mt-1 text-xs text-[#FFFFFF] bg-[#102A43]/40 border border-[#7DD3FC]/20 px-2.5 py-1 rounded-lg">
                        <span className="text-[#7DD3FC] font-semibold text-[11px]">User Asked:</span>{" "}
                        &ldquo;{String(act.details?.userMessage)}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono text-[#9CAFC3] block" suppressHydrationWarning title={act.timestamp}>
                    {mounted ? formatRelativeTime(act.timestamp) : "Recently"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-[#9CAFC3] pt-2 border-t border-[#243447]/60">
        <span suppressHydrationWarning>
          Telemetry Synced: {mounted ? lastRefreshed.toLocaleTimeString() : "--:--:--"}
        </span>
        <span className="text-[#7DD3FC] flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <span>Genuine operational event telemetry</span>
        </span>
      </div>
    </div>
  );
}
