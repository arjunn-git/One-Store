"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Minus,
  RotateCcw,
  Send,
  MessageSquare,
  Package,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Bot,
  User,
} from "lucide-react";
import { useMarket } from "@/lib/context/MarketContext";
import { getOrCreateAnonymousSessionId } from "@/lib/services/session";
import { AIProductCard } from "./AIProductCard";
import type { AIChatMessage, AIChatResponse } from "@/lib/types/ai";

const STORAGE_KEY = "one_store_ai_chat_history";

export function AIAssistantWidget() {
  const { market } = useMarket();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session ID and load saved conversation history
  useEffect(() => {
    const sid = getOrCreateAnonymousSessionId();
    setSessionId(sid);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Default welcome message
    setMessages([
      {
        id: "msg_welcome",
        role: "assistant",
        content: `Welcome to **One Store**. I am your personal AI Shopping Concierge.\n\nI can help you discover flagship studio acoustics, engineered minimalist carry, and precision timepieces tailored for **${
          market === "IN" ? "India (₹ INR)" : "the UK (£ GBP)"
        }**, compare technical specs, or track your verified orders.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickPrompts: [
          "Find products for me",
          market === "IN" ? "Recommend something under ₹10,000" : "Recommend something under £100",
          "Track my order",
          "Compare products",
          "Help me choose a gift",
        ],
        provider: "one-store-concierge",
      },
    ]);
  }, [market]);

  // Save history on change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
      } catch {
        // Storage full or private browsing
      }
    }
  }, [messages]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: AIChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      // Send conversation history (last 4 turns) for context
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          market,
          sessionId,
        }),
      });

      const data: AIChatResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Assistant temporarily busy");
      }

      const assistantMessage: AIChatMessage = {
        id: `asst_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        products: data.products,
        quickPrompts: data.quickPrompts,
        actionLink: data.actionLink,
        orderInfo: data.orderInfo,
        provider: data.provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Connection interrupted";
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `I encountered an unexpected issue connecting to our servers (${errMsg}). You can also search products directly or reach our customer concierge team:`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionLink: {
            label: "Open Store Search",
            href: "/search",
          },
          quickPrompts: [
            "Explore flagship products",
            "What is your return policy?",
            "How does express delivery work?",
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: "msg_new",
        role: "assistant",
        content: `Conversation reset. How can I assist you with your **${
          market === "IN" ? "India" : "UK"
        }** shopping today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickPrompts: [
          "Find products for me",
          market === "IN" ? "Show items under ₹10,000" : "Show items under £100",
          "Track my order",
          "Compare flagship products",
        ],
        provider: "one-store-concierge",
      },
    ]);
  };

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: type } : m))
    );
  };

  // Helper to render bold markdown (**text**) and bullet lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Parse bold segments
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const parsedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-bold text-[#FFFFFF]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={pIdx} className="font-mono text-[11px] bg-[#080B10] px-1.5 py-0.5 rounded border border-[#243447] text-[#7DD3FC]">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-1 text-xs">
            <span className="text-[#7DD3FC] shrink-0 mt-0.5">•</span>
            <span>{parsedLine}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="leading-relaxed my-0.5 text-xs text-[#E2E8F0]">
          {parsedLine}
        </p>
      );
    });
  };

  if (pathname?.startsWith("/admin-portal")) {
    return null;
  }

  return (
    <>
      {/* 1. Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open AI Shopping Assistant"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#102A43] via-[#0c141e] to-[#102A43] border border-[#7DD3FC]/50 text-[#FFFFFF] shadow-2xl shadow-[#7DD3FC]/20 hover:scale-105 hover:border-[#7DD3FC] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7DD3FC]"
        >
          {/* Subtle Ambient Pulse Ring */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7DD3FC] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7DD3FC]" />
          </span>

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#7DD3FC] animate-pulse" />
            <span className="text-xs font-bold tracking-tight">AI Assistant</span>
          </div>
        </button>
      )}

      {/* 2. Chat Modal Interface */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="One Store AI Shopping Assistant"
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-[#080B10] border border-[#243447] shadow-2xl backdrop-blur-2xl ${
            isMinimized
              ? "bottom-5 right-5 sm:bottom-6 sm:right-6 w-72 rounded-2xl p-3 border-[#7DD3FC]/40 cursor-pointer"
              : "inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 w-full sm:w-[410px] h-[92vh] sm:h-[580px] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl"
          }`}
        >
          {/* Header */}
          <div
            onClick={() => isMinimized && setIsMinimized(false)}
            className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#243447] bg-gradient-to-r from-[#102A43]/80 via-[#0c141e] to-[#080B10] rounded-t-3xl sm:rounded-t-2xl shrink-0"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[#102A43] border border-[#7DD3FC]/40 text-[#7DD3FC] flex items-center justify-center shadow-inner">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#FFFFFF] tracking-tight">
                    One Store AI
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#102A43] border border-[#7DD3FC]/30 text-[9px] font-semibold text-[#7DD3FC]">
                    {market === "IN" ? "🇮🇳 IN (₹)" : "🇬🇧 UK (£)"}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Verified Concierge</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    title="Start fresh conversation"
                    className="p-1.5 rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    title="Minimize panel"
                    className="p-1.5 rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                title="Close assistant"
                className="p-1.5 rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation Stream (hidden when minimized) */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Role Icon & Timestamp */}
                    <div className="flex items-center gap-1 text-[10px] text-[#9CAFC3]/70 mb-1 px-1">
                      {msg.role === "assistant" ? (
                        <>
                          <Bot className="h-3 w-3 text-[#7DD3FC]" />
                          <span>AI Concierge</span>
                        </>
                      ) : (
                        <>
                          <span>You</span>
                          <User className="h-3 w-3 text-[#7DD3FC]" />
                        </>
                      )}
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed shadow-md ${
                        msg.role === "user"
                          ? "bg-[#7DD3FC] text-[#080B10] font-medium rounded-tr-sm"
                          : "bg-[#102A43]/50 border border-[#243447] text-[#FFFFFF] rounded-tl-sm space-y-2.5"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p className="text-xs font-semibold">{msg.content}</p>
                      ) : (
                        renderFormattedContent(msg.content)
                      )}

                      {/* Render Order Info Card (if returned) */}
                      {msg.orderInfo && (
                        <div className="p-3 rounded-xl bg-[#080B10] border border-emerald-800/60 text-xs space-y-1.5 mt-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5" /> Order Verified
                            </span>
                            <span>{msg.orderInfo.status.toUpperCase()}</span>
                          </div>
                          <div className="text-[11px] text-[#9CAFC3]">
                            Order Number: <strong className="text-[#FFFFFF]">{msg.orderInfo.orderNumber}</strong>
                          </div>
                          <div className="text-[11px] text-[#9CAFC3]">
                            Total: <strong className="text-[#7DD3FC]">{msg.orderInfo.total}</strong>
                          </div>
                        </div>
                      )}

                      {/* Render Product Recommendation Cards (if returned) */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7DD3FC]">
                            Recommended Gear
                          </div>
                          <div className="space-y-2">
                            {msg.products.map((rec) => (
                              <AIProductCard
                                key={rec.id}
                                product={rec}
                                onNavigate={() => {
                                  // Keep widget open but allow smooth navigation
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contextual Action Link (e.g. view returns, shipping, orders) */}
                      {msg.actionLink && (
                        <div className="pt-1">
                          <Link
                            href={msg.actionLink.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] text-[#7DD3FC] hover:text-[#080B10] font-bold text-[11px] border border-[#7DD3FC]/40 transition-all shadow-sm"
                          >
                            <span>{msg.actionLink.label}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      )}

                      {/* Feedback Buttons for Assistant */}
                      {msg.role === "assistant" && msg.id !== "msg_welcome" && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#243447]/50 text-[10px] text-[#9CAFC3]">
                          <span>Was this response helpful?</span>
                          <div className="flex items-center gap-1">
                            {msg.feedback ? (
                              <span className="text-emerald-400 font-semibold">
                                Thanks for feedback!
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, "up")}
                                  className="p-1 hover:text-emerald-400 transition-colors"
                                  title="Helpful"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, "down")}
                                  className="p-1 hover:text-rose-400 transition-colors"
                                  title="Not helpful"
                                >
                                  <ThumbsDown className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Follow-up Chips (if attached to the last message) */}
                    {msg.quickPrompts && msg.quickPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                        {msg.quickPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSendMessage(prompt)}
                            disabled={isLoading}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-[#102A43]/80 hover:bg-[#7DD3FC] text-[#9CAFC3] hover:text-[#080B10] border border-[#243447] hover:border-[#7DD3FC] transition-all text-left flex items-center gap-1"
                          >
                            <span>{prompt}</span>
                            <ChevronRight className="h-3 w-3 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#102A43]/40 border border-[#243447] max-w-[120px] shadow-inner">
                    <span className="h-2 w-2 rounded-full bg-[#7DD3FC] animate-bounce" />
                    <span
                      className="h-2 w-2 rounded-full bg-[#7DD3FC] animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-[#7DD3FC] animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-[#243447] bg-[#0c141e]/90">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    maxLength={1000}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about products, budget, returns, orders..."
                    disabled={isLoading}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                    className="h-10 w-10 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold flex items-center justify-center shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#7DD3FC]/10"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-[#9CAFC3]/70 pt-1.5 px-1">
                  <span>Press Enter to send</span>
                  <span>{input.length}/1000</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
