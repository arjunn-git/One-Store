"use client";

import { useRef, useState, useEffect } from "react";
import { Globe, Shield, Sparkles, Zap, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export function Hero3DStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 8, y: -6 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 16;

    setRotate({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 6, y: -4 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-4xl mx-auto my-12 py-10 px-4 perspective-1000 select-none cursor-pointer"
    >
      {/* 3D Parallax Main Stage */}
      <div
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: "preserve-3d",
          transition: isHovered ? "transform 0.12s ease-out" : "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="relative w-full min-h-[340px] md:min-h-[380px] rounded-3xl bg-gradient-to-b from-[#102A43]/50 via-[#080B10]/80 to-[#102A43]/30 border border-[#7DD3FC]/30 shadow-2xl shadow-[#7DD3FC]/10 flex flex-col items-center justify-center p-8 overflow-hidden backdrop-blur-md"
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
              <span>Unified Cross-Border Commerce Engine</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#FFFFFF] tracking-tight">
              Bespoke Dual-Market Operations
            </h3>
          </div>
        </div>

        {/* Left 3D Floating Satellite: India (₹ INR) */}
        <div
          style={{
            transform: "translateZ(75px) translateX(-38%) translateY(-40px)",
            transition: "transform 0.4s ease",
          }}
          className="hidden sm:flex absolute left-4 md:left-8 top-12 p-4 rounded-2xl bg-[#080B10]/95 border border-[#243447] hover:border-[#7DD3FC] shadow-xl items-center gap-3.5 backdrop-blur-md hover:scale-105 transition-all"
        >
          <div className="h-11 w-11 rounded-xl bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-mono text-xl font-bold shrink-0 shadow-inner">
            ₹
          </div>
          <div className="text-left text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF]">Market: India</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[11px] text-[#9CAFC3]">INR (₹) • Razorpay &amp; UPI</div>
            <div className="text-[10px] text-[#7DD3FC] font-semibold mt-0.5">Blue Dart Express (1-3d)</div>
          </div>
        </div>

        {/* Right 3D Floating Satellite: UK (£ GBP) */}
        <div
          style={{
            transform: "translateZ(75px) translateX(38%) translateY(-40px)",
            transition: "transform 0.4s ease",
          }}
          className="hidden sm:flex absolute right-4 md:right-8 top-12 p-4 rounded-2xl bg-[#080B10]/95 border border-[#243447] hover:border-[#7DD3FC] shadow-xl items-center gap-3.5 backdrop-blur-md hover:scale-105 transition-all"
        >
          <div className="h-11 w-11 rounded-xl bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-mono text-xl font-bold shrink-0 shadow-inner">
            £
          </div>
          <div className="text-left text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF]">Market: United Kingdom</span>
              <span className="h-2 w-2 rounded-full bg-[#7DD3FC] animate-ping" />
            </div>
            <div className="text-[11px] text-[#9CAFC3]">GBP (£) • Stripe &amp; Apple Pay</div>
            <div className="text-[10px] text-[#7DD3FC] font-semibold mt-0.5">Royal Mail 24 Tracked</div>
          </div>
        </div>

        {/* Bottom 3D Floating Feature Ribbon */}
        <div
          style={{ transform: "translateZ(65px)" }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#9CAFC3] z-20"
        >
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#102A43]/70 border border-[#243447] text-[#FFFFFF]">
            <Check className="h-3 w-3 text-[#7DD3FC]" />
            <span>Zero FX Friction</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#102A43]/70 border border-[#243447] text-[#FFFFFF]">
            <Check className="h-3 w-3 text-[#7DD3FC]" />
            <span>PostgreSQL RLS Security</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#102A43]/70 border border-[#243447] text-[#FFFFFF]">
            <Check className="h-3 w-3 text-[#7DD3FC]" />
            <span>Passwordless OTP Auth</span>
          </span>
        </div>
      </div>
    </div>
  );
}
