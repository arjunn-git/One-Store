"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Radio,
  User,
  X,
} from "lucide-react";
import { CreepyAttractiveBotIcon } from "@/components/ai/CreepyAttractiveBotIcon";

export interface AIConversationItem {
  id: string;
  sessionId: string;
  actor: string;
  authUserId?: string;
  ip?: string;
  market: "IN" | "GB";
  query: string;
  reply: string;
  topic?: string;
  productsRecommended?: { id: string; name: string; price: string }[];
  provider: string;
  timestamp: string;
  feedback?: "helpful" | "unhelpful";
}

export function ClientAiConversationInspector() {
  const [conversations, setConversations] = useState<AIConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<"ALL" | "IN" | "GB">("ALL");
  const [activeModalItem, setActiveModalItem] = useState<AIConversationItem | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai-conversations");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        }
      }
    } catch (err) {
      console.warn("Failed to load AI conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Auto-poll every 10 seconds for live user prompts
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const filtered = conversations.filter((c) => {
    if (selectedMarket !== "ALL" && c.market !== selectedMarket) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchQuery = c.query.toLowerCase().includes(q);
      const matchReply = c.reply.toLowerCase().includes(q);
      const matchActor = c.actor.toLowerCase().includes(q);
      const matchIp = c.ip?.toLowerCase().includes(q);
      return matchQuery || matchReply || matchActor || matchIp;
    }
    return true;
  });

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0C131C] border border-[#243447]/80 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243447]/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#080B10] border border-[#7DD3FC]/40 flex items-center justify-center shadow-lg">
            <CreepyAttractiveBotIcon size="md" isThinking={loading} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#FFFFFF] tracking-tight">
                AI Assistant Live Customer Conversations
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#102A43] border border-[#7DD3FC]/40 text-[#7DD3FC] font-semibold">
                {conversations.length} logged
              </span>
            </div>
            <p className="text-xs text-[#9CAFC3]">
              Real-time audit log of every customer prompt, bot response, recommended product, and IP telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchConversations}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-[#080B10] border border-[#243447] hover:border-[#7DD3FC]/50 text-xs font-medium text-[#7DD3FC] flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-[#9CAFC3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer prompt, response text, or IP..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(["ALL", "IN", "GB"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMarket(m)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedMarket === m
                  ? "bg-[#7DD3FC]/15 text-[#7DD3FC] border border-[#7DD3FC]/40"
                  : "bg-[#080B10] text-[#9CAFC3] border border-[#243447] hover:text-[#FFFFFF]"
              }`}
            >
              {m === "ALL" ? "All Markets" : m === "IN" ? "🇮🇳 India (₹)" : "🇬🇧 UK (£)"}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations Feed Table */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9CAFC3] bg-[#080B10]/50 rounded-xl border border-[#243447]/60 p-6 space-y-2">
            <MessageSquare className="h-7 w-7 text-[#9CAFC3]/40 mx-auto" />
            <div className="font-semibold text-[#FFFFFF]">No Customer Conversations Yet</div>
            <p className="max-w-md mx-auto text-xs text-[#9CAFC3]">
              Every customer message typed into the Nocturne AI assistant will record here immediately with full user prompt, AI reply, products recommended, and IP address.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveModalItem(item)}
              className="p-3.5 rounded-xl bg-[#080B10]/80 border border-[#243447]/80 hover:border-[#7DD3FC]/50 hover:bg-[#102A43]/20 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.market === "GB"
                        ? "bg-sky-950/40 text-sky-300 border-sky-800/50"
                        : "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                    }`}
                  >
                    {item.market === "GB" ? "🇬🇧 UK (£)" : "🇮🇳 India (₹)"}
                  </span>
                  <span className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                    <User className="h-3 w-3 text-[#7DD3FC]" />
                    <span className="truncate max-w-[180px]">{item.actor}</span>
                  </span>
                  {item.ip && (
                    <span className="font-mono text-[10px] text-[#9CAFC3] bg-[#102A43]/40 px-1.5 py-0.2 rounded border border-[#243447]/60">
                      IP: {item.ip}
                    </span>
                  )}
                  <span className="text-[10px] text-[#9CAFC3] ml-auto">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>

                {/* Customer Prompt */}
                <div className="text-xs text-[#7DD3FC] font-medium flex items-start gap-1.5">
                  <span className="font-bold shrink-0 text-[#FFFFFF]">User:</span>
                  <span className="truncate max-w-xl">&ldquo;{item.query}&rdquo;</span>
                </div>

                {/* AI Snippet */}
                <div className="text-[11px] text-[#9CAFC3] truncate max-w-2xl">
                  <span className="text-[#A855F7] font-semibold">Nocturne: </span>
                  {item.reply.replace(/\*\*/g, "").slice(0, 120)}...
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 justify-end">
                {item.productsRecommended && item.productsRecommended.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#102A43] text-[#7DD3FC] border border-[#7DD3FC]/30 font-semibold">
                    {item.productsRecommended.length} Product{item.productsRecommended.length > 1 ? "s" : ""}
                  </span>
                )}
                {item.feedback && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                      item.feedback === "helpful"
                        ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800"
                        : "bg-rose-950/40 text-rose-300 border border-rose-800"
                    }`}
                  >
                    {item.feedback === "helpful" ? <ThumbsUp className="h-2.5 w-2.5" /> : <ThumbsDown className="h-2.5 w-2.5" />}
                  </span>
                )}
                <div className="p-1 rounded text-[#9CAFC3] group-hover:text-[#7DD3FC] transition-colors">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed Modal Inspector */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080B10]/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0C131C] border border-[#243447] p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#243447] pb-3">
              <div className="flex items-center gap-2.5">
                <CreepyAttractiveBotIcon size="sm" />
                <div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Customer Conversation Details</h3>
                  <div className="text-[10px] text-[#9CAFC3] font-mono">
                    Session: {activeModalItem.sessionId} • {new Date(activeModalItem.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="p-1.5 rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meta Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-[#080B10] border border-[#243447]/60">
                <span className="text-[#9CAFC3] block text-[10px]">Actor / Email</span>
                <strong className="text-[#FFFFFF] truncate block">{activeModalItem.actor}</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#080B10] border border-[#243447]/60">
                <span className="text-[#9CAFC3] block text-[10px]">Client IP</span>
                <strong className="text-[#7DD3FC] font-mono block">{activeModalItem.ip || "127.0.0.1"}</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#080B10] border border-[#243447]/60">
                <span className="text-[#9CAFC3] block text-[10px]">Storefront Market</span>
                <strong className="text-emerald-400 block">
                  {activeModalItem.market === "GB" ? "United Kingdom (£ GBP)" : "India (₹ INR)"}
                </strong>
              </div>
              <div className="p-2 rounded-lg bg-[#080B10] border border-[#243447]/60">
                <span className="text-[#9CAFC3] block text-[10px]">Engine</span>
                <strong className="text-[#A855F7] font-mono block">{activeModalItem.provider}</strong>
              </div>
            </div>

            {/* Exact Customer Prompt */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#7DD3FC] flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Exact Customer Prompt:</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080B10] border border-[#7DD3FC]/40 text-xs text-[#FFFFFF] font-medium leading-relaxed">
                {activeModalItem.query}
              </div>
            </div>

            {/* AI Response */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#A855F7] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#A855F7]" />
                <span>Nocturne AI Response:</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#E2E8F0] whitespace-pre-wrap leading-relaxed font-sans">
                {activeModalItem.reply}
              </div>
            </div>

            {/* Products Recommended */}
            {activeModalItem.productsRecommended && activeModalItem.productsRecommended.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-emerald-400">Products Recommended in Chat:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeModalItem.productsRecommended.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-[#102A43]/40 border border-[#243447] flex items-center justify-between"
                    >
                      <span className="text-[#FFFFFF] font-medium truncate">{p.name}</span>
                      <span className="text-[#7DD3FC] font-bold shrink-0">{p.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
