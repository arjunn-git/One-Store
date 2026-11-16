"use client";

import { useRef } from "react";
import { ShieldCheck, Truck, RotateCcw, Sparkles, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";

export function Hero3DStage() {
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

    const rotX = ((y - centerY) / centerY) * -12;
    const rotY = ((x - centerX) / centerX) * 14;

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
      className="relative w-full max-w-4xl mx-auto my-6 sm:my-10 py-4 sm:py-6 px-2 sm:px-4 perspective-1000 select-none"
    >
      {/* 3D Parallax Main Stage */}
      <div
        ref={stageRef}
        style={{
          transform: "rotateX(6deg) rotateY(-4deg)",
          transformStyle: "preserve-3d",
          transition: "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="relative w-full min-h-[300px] sm:min-h-[340px] md:min-h-[380px] rounded-3xl bg-gradient-to-b from-[#102A43]/70 via-[#080B10]/95 to-[#102A43]/50 border border-[#7DD3FC]/30 shadow-2xl shadow-[#7DD3FC]/10 flex flex-col items-center justify-center p-5 sm:p-8 overflow-hidden backdrop-blur-md will-change-transform"
      >
        {/* 3D Background Glowing Depth Rings */}
        <div
          style={{ transform: "translateZ(-40px)" }}
          className="absolute w-72 h-72 rounded-full border border-[#7DD3FC]/20 animate-pulse-glow pointer-events-none"
        />
        <div
          style={{ transform: "translateZ(-80px)" }}
          className="absolute w-96 h-96 rounded-full border border-[#243447]/60 pointer-events-none"
        />
        <div
          style={{ transform: "translateZ(-20px)" }}
          className="absolute inset-0 bg-radial from-[#7DD3FC]/10 via-transparent to-transparent pointer-events-none"
        />

        {/* Central 3D Holographic Core */}
        <div
          style={{ transform: "translateZ(50px)" }}
          className="relative z-20 flex flex-col items-center justify-center text-center space-y-3"
        >
          {/* Animated 3D Core Logo Badge */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#102A43] to-[#080B10] border-2 border-[#7DD3FC] flex items-center justify-center text-[#7DD3FC] shadow-2xl shadow-[#7DD3FC]/40 group-hover:scale-110 transition-transform duration-500 animate-float-bob">
              <span className="font-mono text-4xl font-black tracking-tighter">1</span>
            </div>
            {/* Ambient Cyan Aura */}
            <div className="absolute -inset-2 rounded-3xl bg-[#7DD3FC]/25 blur-xl -z-10 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102A43]/90 border border-[#7DD3FC]/40 text-[11px] font-semibold text-[#7DD3FC] shadow-sm">
              <Sparkles className="h-3 w-3" />
              <span>India Flagship Studio Collection</span>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-[#FFFFFF] tracking-tight">
              Curated Luxury &amp; Audio Engineering
            </h2>
            <p className="text-xs sm:text-sm text-[#9CAFC3] max-w-md mx-auto leading-relaxed">
              Precision studio acoustics, tactical EDC carry, and surgical chronographs delivered express across India.
            </p>
          </div>
        </div>

        {/* Left 3D Floating Feature: India Store Advantage */}
        <div
          style={{
            transform: "translateZ(45px)",
            transition: "transform 0.3s ease",
          }}
          className="hidden md:flex absolute left-4 lg:left-6 top-4 lg:top-6 p-3 lg:p-3.5 rounded-2xl bg-[#080B10]/95 border border-[#7DD3FC]/40 shadow-xl items-center gap-3 backdrop-blur-md text-left z-20 max-w-[230px]"
        >
          <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center font-mono text-lg lg:text-xl font-bold shrink-0 shadow-inner">
            ₹
          </div>
          <div className="text-left text-xs min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF] truncate">India Flagship</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
            </div>
            <div className="text-[11px] text-[#9CAFC3] truncate">Instant UPI &amp; 0-Cost EMI</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5 truncate">Blue Dart Air Express (1-3d)</div>
          </div>
        </div>

        {/* Right 3D Floating Feature: GST & National Coverage */}
        <div
          style={{
            transform: "translateZ(45px)",
            transition: "transform 0.3s ease",
          }}
          className="hidden md:flex absolute right-4 lg:right-6 top-4 lg:top-6 p-3 lg:p-3.5 rounded-2xl bg-[#080B10]/95 border border-[#7DD3FC]/40 shadow-xl items-center gap-3 backdrop-blur-md text-left z-20 max-w-[230px]"
        >
          <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl bg-[#102A43] border border-emerald-500/50 text-emerald-400 flex items-center justify-center font-mono text-lg lg:text-xl font-bold shrink-0 shadow-inner">
            <Zap className="h-5 w-5" />
          </div>
          <div className="text-left text-xs min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#FFFFFF] truncate">19,000+ PIN Codes</span>
            </div>
            <div className="text-[11px] text-[#9CAFC3] truncate">GST Invoice with ITC</div>
            <div className="text-[10px] text-[#7DD3FC] font-semibold mt-0.5 truncate">Free shipping &gt; ₹1,999</div>
          </div>
        </div>

        {/* Bottom 3D Floating Feature Ribbon */}
        <div
          style={{ transform: "translateZ(65px)" }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#9CAFC3] z-20"
        >
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43]/85 border border-[#243447] text-[#FFFFFF] shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-semibold">100% Certified Authentic</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43]/85 border border-[#243447] text-[#FFFFFF] shadow-sm">
            <Truck className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-semibold">All-India Air Express</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43]/85 border border-[#243447] text-[#FFFFFF] shadow-sm">
            <RotateCcw className="h-3.5 w-3.5 text-[#7DD3FC]" />
            <span className="font-semibold">14-Day Doorstep Returns</span>
          </span>
        </div>
      </div>
    </div>
  );
}
