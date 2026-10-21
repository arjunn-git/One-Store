"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Minus,
  RotateCcw,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Package,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  User,
  Sparkles,
  ArrowRight,
  Search,
  Scale,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { SiriOrb, type OrbState } from "./SiriOrb";
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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0.0 to 1.0
  const [micError, setMicError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Web Audio & Speech Recognition Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

    // Default welcoming message matching the Siri Concierge UI concept
    setMessages([
      {
        id: "msg_welcome",
        role: "assistant",
        content: `Hi! 👋 How can I help you today?\n\nI am your **One Store Concierge** — intelligent shopping assistant for **${
          market === "IN" ? "India (₹ INR)" : "the UK (£ GBP)"
        }**. Ask me to find products, compare specifications, track orders, or curate recommendations within your budget.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickPrompts: [
          "🔍 Find a product",
          "⇄ Compare items",
          "📦 Track my order",
          market === "IN" ? "⚡ Under ₹10,000" : "⚡ Under £100",
        ],
        provider: "one-store-siri-engine",
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

  // Clean up all audio streams and speech on unmount
  const stopListening = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [stopListening, stopSpeaking]);

  // Synthesize speech for assistant responses
  const speakText = useCallback(
    (rawText: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      stopSpeaking();

      // Clean markdown tags for natural speech
      const cleanText = rawText
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/`(.*?)`/g, "$1")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .replace(/#+\s/g, "")
        .replace(/•/g, "")
        .replace(/\n+/g, " ")
        .slice(0, 450); // Keep spoken output concise

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Select high quality natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Google") || v.name.includes("Samantha"))
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      setIsSpeaking(true);

      // Speaking audio ripple animation loop
      let animStep = 0;
      const speechInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(speechInterval);
          setIsSpeaking(false);
          setAudioLevel(0);
          return;
        }
        animStep += 0.25;
        // Natural speech rhythmic wave modulation
        const wave = 0.35 + 0.35 * Math.sin(animStep) + 0.15 * Math.cos(animStep * 2.3);
        setAudioLevel(Math.max(0.1, Math.min(1, wave)));
      }, 70);

      utterance.onend = () => {
        clearInterval(speechInterval);
        setIsSpeaking(false);
        setAudioLevel(0);
        activeUtteranceRef.current = null;
      };

      utterance.onerror = () => {
        clearInterval(speechInterval);
        setIsSpeaking(false);
        setAudioLevel(0);
        activeUtteranceRef.current = null;
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [stopSpeaking]
  );

  // Activate microphone for real-time audio visualization and speech transcription
  const startListening = async () => {
    setMicError(null);
    stopSpeaking();

    if (isListening) {
      stopListening();
      return;
    }

    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError("Microphone not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);

      // Real audio frequency tracking loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1, avg / 120);
        setAudioLevel(normalized);

        rafRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();

      // Web Speech Recognition for voice-to-text
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = market === "IN" ? "en-IN" : "en-GB";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join("");
          setInput(transcript);

          if (event.results[0].isFinal) {
            stopListening();
            handleSendMessage(transcript);
          }
        };

        recognition.onerror = () => {
          stopListening();
        };

        recognition.onend = () => {
          stopListening();
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
      }
    } catch (err: any) {
      console.warn("Microphone access declined or unavailable:", err);
      setMicError("Microphone access denied or unavailable");
      stopListening();
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    stopListening();
    stopSpeaking();

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

      // If voice enabled, speak the reply
      if (isVoiceEnabled) {
        speakText(data.reply);
      }
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
            "🔍 Explore flagship products",
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
    stopListening();
    stopSpeaking();
    localStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: "msg_new",
        role: "assistant",
        content: `Conversation restarted. How can I assist your shopping in **${
          market === "IN" ? "India (₹ INR)" : "the UK (£ GBP)"
        }** today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickPrompts: [
          "🔍 Find a product",
          "⇄ Compare items",
          "📦 Track my order",
          market === "IN" ? "⚡ Under ₹10,000" : "⚡ Under £100",
        ],
        provider: "one-store-siri-engine",
      },
    ]);
  };

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: type } : m))
    );
    try {
      fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "AI_ASSISTANT_QUERY",
          action: `Shopper rated AI response: ${type === "up" ? "👍 Helpful" : "👎 Unhelpful"}`,
          actor: "Storefront Shopper",
          anonymousSessionId: sessionId,
          market,
          currency: market === "GB" ? "GBP" : "INR",
          resourceType: "ai_feedback",
          details: { messageId, rating: type },
        }),
      }).catch(() => {});
    } catch {}
  };

  // Helper to render bold markdown (**text**) and code blocks
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
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
            <code
              key={pIdx}
              className="px-1.5 py-0.5 rounded bg-[#102A43] text-[#7DD3FC] font-mono text-[11px]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs my-0.5 text-[#E2E8F0]">
            {parsedLine}
          </li>
        );
      }

      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-xs my-0.5 text-[#E2E8F0] leading-relaxed">
          {parsedLine}
        </p>
      );
    });
  };

  // Derive current Orb state
  const currentOrbState: OrbState = isListening
    ? "listening"
    : isLoading
    ? "thinking"
    : isSpeaking
    ? "speaking"
    : "idle";

  // Hide widget completely on admin portal routes
  if (pathname?.startsWith("/admin-portal")) {
    return null;
  }

  return (
    <>
      {/* 1. Floating Launcher Pill with Siri Animated AI Orb */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open One Store AI Assistant"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-3.5 pl-2.5 pr-4 py-2 rounded-full bg-[#080B10]/90 backdrop-blur-xl border border-[#00F0FF]/40 text-[#FFFFFF] shadow-[0_0_30px_rgba(0,240,255,0.22)] hover:border-[#A855F7]/80 hover:shadow-[0_0_35px_rgba(168,85,247,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
        >
          {/* Glowing Siri Orb inside launcher */}
          <div className="relative flex items-center justify-center">
            <SiriOrb size="sm" state="idle" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#080B10] shadow-[0_0_8px_#34D399]" />
          </div>

          {/* Text branding from design concept (Panel 1) */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold tracking-tight text-[#FFFFFF]">One Store AI</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40">
                AI
              </span>
            </div>
            <span className="text-[9px] font-semibold tracking-wider uppercase text-[#818CF8]">
              SHOPPING ASSISTANT
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-[#7DD3FC]/80 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* 2. Glassmorphic Chat Window (Desktop Window & Mobile Bottom Sheet) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="One Store AI Concierge"
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-[#080B10]/95 border border-[#243447] shadow-[0_0_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl ${
            isMinimized
              ? "bottom-5 right-5 sm:bottom-6 sm:right-6 w-80 rounded-2xl p-3 border-[#00F0FF]/40 cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.2)]"
              : "inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 w-full sm:w-[420px] h-[92vh] sm:h-[600px] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl border-t sm:border border-[#00F0FF]/30"
          }`}
        >
          {/* Header */}
          <div
            onClick={() => isMinimized && setIsMinimized(false)}
            className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#243447]/80 bg-gradient-to-r from-[#102A43]/70 via-[#0C131C] to-[#080B10] rounded-t-3xl sm:rounded-t-2xl shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <SiriOrb
                  size="sm"
                  state={currentOrbState}
                  audioLevel={audioLevel}
                  interactive
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else if (isListening) stopListening();
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#FFFFFF] tracking-tight">
                    One Store Concierge
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#102A43] border border-[#00F0FF]/30 text-[9px] font-bold text-[#7DD3FC]">
                    {market === "IN" ? "🇮🇳 IN (₹)" : "🇬🇧 UK (£)"}
                  </span>
                </div>

                <div className="text-[10px] font-semibold flex items-center gap-1.5 mt-0.5">
                  {isListening ? (
                    <span className="text-[#00F0FF] flex items-center gap-1 animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#00F0FF]" />
                      Listening... speak now
                    </span>
                  ) : isLoading ? (
                    <span className="text-[#38BDF8] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                      Processing request...
                    </span>
                  ) : isSpeaking ? (
                    <span className="text-[#A855F7] flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                      Speaking answer...
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Online
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <>
                  {/* Voice Output Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) stopSpeaking();
                      setIsVoiceEnabled(!isVoiceEnabled);
                    }}
                    title={isVoiceEnabled ? "Mute spoken voice responses" : "Enable spoken voice responses"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isVoiceEnabled
                        ? "text-[#00F0FF] bg-[#00F0FF]/10 border border-[#00F0FF]/30"
                        : "text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43]"
                    }`}
                  >
                    {isVoiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                  </button>

                  {/* Reset Chat History */}
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    title="Start fresh conversation"
                    className="p-1.5 rounded-lg text-[#9CAFC3] hover:text-[#FFFFFF] hover:bg-[#102A43] transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>

                  {/* Minimize Panel */}
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

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  stopSpeaking();
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

          {/* Conversation Stream */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Role Header & Timestamp */}
                    <div className="flex items-center gap-1.5 text-[10px] text-[#9CAFC3]/70 mb-1 px-1">
                      {msg.role === "assistant" ? (
                        <>
                          <SiriOrb size="xs" state="idle" />
                          <span className="font-bold text-[#7DD3FC]">One Store AI</span>
                        </>
                      ) : (
                        <>
                          <span>You</span>
                          <User className="h-3 w-3 text-[#7DD3FC]" />
                        </>
                      )}
                      <span>•</span>
                      <span>{msg.timestamp}</span>

                      {/* Read aloud button for assistant responses */}
                      {msg.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.content)}
                          title="Listen to this response"
                          className="ml-1 text-[#9CAFC3] hover:text-[#00F0FF] transition-colors"
                        >
                          <Volume2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed shadow-lg ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[#00F0FF] to-[#0284C7] text-[#080B10] font-medium rounded-tr-sm"
                          : "bg-[#0C131C] border border-[#243447] text-[#FFFFFF] rounded-tl-sm space-y-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
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
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#7DD3FC] flex items-center justify-between">
                            <span>Recommended Gear</span>
                            <span className="text-[#9CAFC3] font-normal lowercase">in stock</span>
                          </div>
                          <div className="space-y-2">
                            {msg.products.map((rec) => (
                              <AIProductCard
                                key={rec.id}
                                product={rec}
                                onNavigate={() => {
                                  // Keep widget open
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43] hover:bg-[#00F0FF] text-[#00F0FF] hover:text-[#080B10] font-bold text-[11px] border border-[#00F0FF]/40 transition-all shadow-sm"
                          >
                            <span>{msg.actionLink.label}</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      )}

                      {/* Feedback Buttons for Assistant */}
                      {msg.role === "assistant" && msg.id !== "msg_welcome" && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#243447]/60 text-[10px] text-[#9CAFC3]">
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

                    {/* Quick Suggestion Prompts (from UI Concept) */}
                    {msg.quickPrompts && msg.quickPrompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                        {msg.quickPrompts.map((prompt, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSendMessage(prompt.replace(/^[🔍⇄📦⚡]\s*/, ""))}
                            disabled={isLoading}
                            className="text-[11px] px-3 py-1.5 rounded-full bg-[#102A43]/70 hover:bg-[#00F0FF] text-[#9CAFC3] hover:text-[#080B10] border border-[#243447] hover:border-[#00F0FF] transition-all text-left flex items-center gap-1.5 shadow-sm font-medium"
                          >
                            <span>{prompt}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Animated Thinking State with Siri Orb */}
                {isLoading && (
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#0C131C] border border-[#243447] max-w-[200px] shadow-lg">
                    <SiriOrb size="xs" state="thinking" />
                    <span className="text-xs text-[#7DD3FC] font-medium animate-pulse">
                      Thinking...
                    </span>
                  </div>
                )}

                {/* Listening Live Audio Waveform Banner */}
                {isListening && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] shadow-inner">
                    <div className="flex items-center gap-2.5">
                      <SiriOrb size="xs" state="listening" audioLevel={audioLevel} />
                      <span className="text-xs font-semibold">Listening to your voice...</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopListening}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-medium"
                    >
                      Stop
                    </button>
                  </div>
                )}

                {/* Microphone error toast (if denied) */}
                {micError && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {micError}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMicError(null)}
                      className="text-amber-400 hover:underline text-[11px] ml-2 font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar (Panel 2 & 4 style) */}
              <div className="p-3 border-t border-[#243447]/80 bg-[#0C131C]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  {/* Microphone Voice Activation Button */}
                  <button
                    type="button"
                    onClick={startListening}
                    title={isListening ? "Stop listening" : "Activate voice input (microphone)"}
                    aria-label="Microphone input"
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isListening
                        ? "bg-rose-500 text-[#FFFFFF] shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse"
                        : "bg-[#102A43] text-[#7DD3FC] hover:text-[#FFFFFF] hover:bg-[#102A43]/80 border border-[#243447]"
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  {/* Text Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    maxLength={1000}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening... speak now..." : "Ask another question..."}
                    disabled={isLoading}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-xs text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] disabled:opacity-50 transition-all"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label="Send message"
                    className="h-10 w-10 rounded-xl bg-[#00F0FF] hover:bg-[#FFFFFF] text-[#080B10] font-bold flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-[#00F0FF]/20"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>

                <div className="flex items-center justify-between text-[10px] text-[#9CAFC3]/70 pt-1.5 px-1">
                  <span>Voice or text • Enter to send</span>
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
