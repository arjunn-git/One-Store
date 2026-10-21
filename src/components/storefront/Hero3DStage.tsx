"use client";

import { useRef } from "react";
import { ShieldCheck, Truck, RotateCcw, Sparkles, Check, Gift } from "lucide-react";
import Link from "next/link";
import { useMarket } from "@/lib/context/MarketContext";

export function Hero3DStage() {
  const { market, setMarket } = useMarket();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 16;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (stageRef.current) {
        stageRef.current.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      }
    });
  };

  const handleMouseEnter = () => {
    if (stageRef.current) {
      stageRef.current.style.transition = "transform 0.12s ease-out";
    }
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (stageRef.current) {
      stageRef.current.style.transition = "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)";
      stageRef.current.style.transform = "rotateX(6deg) rotateY(-4deg)";
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-4xl mx-auto my-6 sm:my-10 py-4 sm:py-6 px-2 sm:px-4 perspective-1000 select-none cursor-pointer"
    >
      {/* 3D Parallax Main Stage */}
      <div
        ref={stageRef}
        style={{
          transform: "rotateX(6deg) rotateY(-4deg)",
          transformStyle: "preserve-3d",
          transition: "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="relative w-full min-h-[300px] sm:min-h-[340px] md:min-h-[380px] rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#102A43]/60 via-[#080B10]/90 to-[#102A43]/40 border border-[#7DD3FC]/30 shadow-2xl shadow-[#7DD3FC]/10 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden backdrop-blur-md will-change-transform"
      >
        {/* 3D Background Glowing Depth Rings */}
        <div
          style={{ transform: "translateZ(-40px)" }}
          className="absolute w-72 h-72 rounded-full border border-[#7DD3FC]/15 animate-pulse-glow pointer-events-none"
        />
        <div
          style={{ transform: "translateZ(-80px)" }}
          className="absolute w-96 h-96 rounded-full border border-[#243447]/50 pointer-events-none"
        />
        <div
          style={{ transform: "translateZ(-20px)" }}
          className="absolute inset-0 bg-radial from-[#7DD3FC]/5 via-transparent to-transparent pointer-events-none"
        />

        {/* Central 3D Holographic Core */}
        <div
          style={{ transform: "translateZ(50px)" }}
          className="relative z-20 flex flex-col items-center justify-center text-center space-y-3"
        >
          {/* Animated 3D Core Cube */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-[#102A43] border-2 border-[#7DD3FC] flex items-center justify-center text-[#7DD3FC] shadow-2xl shadow-[#7DD3FC]/40 group-hover:scale-110 transition-transform duration-500 animate-float-bob">
              <span className="font-mono text-4xl font-black tracking-tighter">1</span>
            </div>
            {/* Ambient Cyan Aura */}
            <div className="absolute -inset-2 rounded-3xl bg-[#7DD3FC]/20 blur-xl -z-10 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102A43]/90 border border-[#7DD3FC]/40 text-[11px] font-semibold text-[#7DD3FC] shadow-sm">
              <Sparkles className="h-3 w-3" />
              <span>Curated Flagship Collection</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#FFFFFF] tracking-tight">
              Premium Lifestyle &amp; Studio Gear
            </h3>
            <p className="text-xs text-[#9CAFC3] max-w-md mx-auto">
              Engineered hardware, studio audio &amp; minimalist carry delivered express to India &amp; the United Kingdom.
            </p>
          </div>
        </div>

        {/* Left 3D Floating Satellite: India (₹ INR) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMarket("IN");
          }}
          aria-label="Switch to India Store"
          style={{
            transform: "translateZ(45px)",
            transition: "transform 0.3s ease, border-color 0.2s, box-shadow 0.2s",
          }}
          className={`hidden md:flex absolute left-4 lg:left-6 top-4 lg:top-6 p-3 lg:p-3.5 rounded-2xl bg-[#080B10]/95 border shadow-xl items-center gap-3 backdrop-blur-md hover:scale-105 transition-all text-left z-20 max-w-[215px] lg:max-w-[240px] ${
            market === "IN"
              ? "border-[#7DD3FC] ring-2 ring-[#7DD3FC]/30 shadow-[#7DD3FC]/20"
              : "border-[#243447] hover:border-[#7DD3FC]/60 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-mono text-lg lg:text-xl font-bold shrink-0 shadow-inner">
            ₹
          </div>
          <div className="text-left text-xs min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF] truncate">India Store</span>
              {market === "IN" ? (
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
              ) : (
                <span className="text-[10px] text-[#7DD3FC] underline ml-1 shrink-0">Switch</span>
              )}
            </div>
            <div className="text-[11px] text-[#9CAFC3] truncate">Instant UPI &amp; 0-Cost EMI</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 truncate">Blue Dart Express (1-3d)</div>
          </div>
        </button>

        {/* Right 3D Floating Satellite: UK (£ GBP) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMarket("GB");
          }}
          aria-label="Switch to UK Flagship Store"
          style={{
            transform: "translateZ(45px)",
            transition: "transform 0.3s ease, border-color 0.2s, box-shadow 0.2s",
          }}
          className={`hidden md:flex absolute right-4 lg:right-6 top-4 lg:top-6 p-3 lg:p-3.5 rounded-2xl bg-[#080B10]/95 border shadow-xl items-center gap-3 backdrop-blur-md hover:scale-105 transition-all text-left z-20 max-w-[215px] lg:max-w-[240px] ${
            market === "GB"
              ? "border-[#7DD3FC] ring-2 ring-[#7DD3FC]/30 shadow-[#7DD3FC]/20"
              : "border-[#243447] hover:border-[#7DD3FC]/60 opacity-80 hover:opacity-100"
          }`}
        >
          <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-mono text-lg lg:text-xl font-bold shrink-0 shadow-inner">
            £
          </div>
          <div className="text-left text-xs min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF] truncate">UK Flagship</span>
              {market === "GB" ? (
                <span className="h-2 w-2 rounded-full bg-[#7DD3FC] shrink-0 animate-ping" />
              ) : (
                <span className="text-[10px] text-[#7DD3FC] underline ml-1 shrink-0">Switch</span>
              )}
            </div>
            <div className="text-[11px] text-[#9CAFC3] truncate">Apple Pay, Klarna &amp; Cards</div>
            <div className="text-[10px] text-[#7DD3FC] font-semibold mt-0.5 truncate">Royal Mail 24 Tracked</div>
          </div>
        </button>

        {/* Mobile & Small Screen Responsive Market Selector */}
        <div
          style={{ transform: "translateZ(45px)" }}
          className="md:hidden flex items-center justify-center gap-2 mt-4 z-20 w-full max-w-xs px-2"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMarket("IN");
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              market === "IN"
                ? "bg-[#102A43] border-[#7DD3FC] text-[#FFFFFF] shadow-md shadow-[#7DD3FC]/20 ring-1 ring-[#7DD3FC]"
                : "bg-[#080B10]/90 border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
            }`}
          >
            <span className="font-mono text-sm text-[#7DD3FC]">₹</span>
            <span>India Store</span>
            {market === "IN" && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMarket("GB");
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              market === "GB"
                ? "bg-[#102A43] border-[#7DD3FC] text-[#FFFFFF] shadow-md shadow-[#7DD3FC]/20 ring-1 ring-[#7DD3FC]"
                : "bg-[#080B10]/90 border-[#243447] text-[#9CAFC3] hover:text-[#FFFFFF]"
            }`}
          >
            <span className="font-mono text-sm text-[#7DD3FC]">£</span>
            <span>UK Flagship</span>
            {market === "GB" && <span className="h-2 w-2 rounded-full bg-[#7DD3FC]" />}
          </button>
        </div>

        {/* Bottom 3D Floating Feature Ribbon (Marketing Hooks) */}
        <div
          style={{ transform: "translateZ(65px)" }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#9CAFC3] z-20"
        >
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43]/80 border border-[#243447] text-[#FFFFFF] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-semibold">100% Authentic Guaranteed</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43]/80 border border-[#243447] text-[#FFFFFF] shadow-sm">
            <Truck className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-semibold">Free Express Air Shipping</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43]/80 border border-[#243447] text-[#FFFFFF] shadow-sm">
            <RotateCcw className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-semibold">14-Day Risk-Free Returns</span>
          </span>
        </div>
      </div>
    </div>
  );
}
