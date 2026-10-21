"use client";

import React from "react";
import {
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

export type LogoVariant = "primary" | "loading" | "state";
export type LogoState = "security" | "success" | "error" | "default";
export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
export type LogoLayout = "horizontal" | "stacked" | "card";

export interface OneStoreLogoProps {
  variant?: LogoVariant;
  state?: LogoState;
  size?: LogoSize;
  layout?: LogoLayout;
  asCard?: boolean;
  badge?: string;
  className?: string;
  showText?: boolean;
}

export function OneStoreLogo({
  variant = "primary",
  state = "default",
  size = "md",
  layout = "horizontal",
  asCard = false,
  badge,
  className = "",
  showText = true,
}: OneStoreLogoProps) {
  // Dimensions per size
  const sizeStyles = {
    xs: {
      box: "h-6 w-6 rounded-md",
      icon: "h-3.5 w-3.5",
      svg: 16,
      textOne: "text-xs font-black",
      textStore: "text-[9px] tracking-wider font-bold",
      singleLine: "text-xs font-extrabold tracking-tight",
      gap: "gap-1.5",
    },
    sm: {
      box: "h-8 w-8 rounded-lg",
      icon: "h-4 w-4",
      svg: 20,
      textOne: "text-sm font-black",
      textStore: "text-[10px] tracking-widest font-bold",
      singleLine: "text-sm font-extrabold tracking-tight",
      gap: "gap-2",
    },
    md: {
      box: "h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl",
      icon: "h-4 w-4 sm:h-5 sm:w-5",
      svg: 24,
      textOne: "text-sm sm:text-base font-black",
      textStore: "text-[10px] sm:text-[11px] tracking-widest font-bold",
      singleLine: "text-sm sm:text-lg font-extrabold tracking-tight",
      gap: "gap-2 sm:gap-2.5",
    },
    lg: {
      box: "h-12 w-12 rounded-2xl",
      icon: "h-6 w-6",
      svg: 30,
      textOne: "text-xl font-black",
      textStore: "text-xs tracking-widest font-bold",
      singleLine: "text-xl font-extrabold tracking-tight",
      gap: "gap-3",
    },
    xl: {
      box: "h-16 w-16 rounded-3xl",
      icon: "h-8 w-8",
      svg: 40,
      textOne: "text-2xl font-black",
      textStore: "text-sm tracking-widest font-bold",
      singleLine: "text-2xl font-black tracking-widest",
      gap: "gap-3.5",
    },
  }[size];

  // ---------------------------------------------------------------------------
  // 1. Icon Renderer
  // ---------------------------------------------------------------------------
  const renderIcon = () => {
    if (variant === "loading") {
      // Elegant SVG loading arc with restrained motion
      return (
        <div
          className={`relative ${sizeStyles.box} bg-[#080B10] border border-[#7DD3FC]/40 flex items-center justify-center shadow-inner overflow-hidden`}
        >
          {/* Subtle glowing backdrop */}
          <div className="absolute inset-0 bg-[#7DD3FC]/10 blur-sm rounded-full pointer-events-none" />

          {/* Restrained rotating arc spinner */}
          <svg
            className="w-3/5 h-3/5 text-[#7DD3FC] motion-safe:animate-[spin_2.5s_linear_infinite] motion-reduce:animate-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <path
              className="opacity-100"
              d="M12 3a9 9 0 0 1 9 9"
            />
          </svg>
        </div>
      );
    }

    if (variant === "state") {
      // Security / Success / Error state variants
      if (state === "security") {
        return (
          <div
            className={`${sizeStyles.box} bg-[#102A43] border border-[#7DD3FC]/50 text-[#7DD3FC] flex items-center justify-center shadow-md`}
          >
            <ShieldCheck className={`${sizeStyles.icon} stroke-[2.2]`} />
          </div>
        );
      }
      if (state === "success") {
        return (
          <div
            className={`${sizeStyles.box} bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 flex items-center justify-center shadow-md`}
          >
            <CheckCircle2 className={`${sizeStyles.icon} stroke-[2.2]`} />
          </div>
        );
      }
      if (state === "error") {
        return (
          <div
            className={`${sizeStyles.box} bg-rose-950/80 border border-rose-500/60 text-rose-300 flex items-center justify-center shadow-md`}
          >
            <AlertTriangle className={`${sizeStyles.icon} stroke-[2.2]`} />
          </div>
        );
      }
    }

    // Default & Primary: Official ONE STORE brand mark (Shopping bag with cyan handle)
    return (
      <div
        className={`${sizeStyles.box} bg-[#102A43] border border-[#243447] text-[#7DD3FC] flex items-center justify-center shadow-md group-hover:border-[#7DD3FC]/70 transition-colors`}
      >
        <ShoppingBag className={`${sizeStyles.icon} stroke-[2.2]`} />
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 2. Text Renderer
  // ---------------------------------------------------------------------------
  const renderText = () => {
    if (!showText) return null;

    if (layout === "stacked") {
      return (
        <div className="flex flex-col text-left leading-none">
          <span className={`${sizeStyles.textOne} text-[#FFFFFF]`}>ONE</span>
          <span className={`${sizeStyles.textStore} text-[#7DD3FC] mt-0.5`}>STORE</span>
        </div>
      );
    }

    // Default horizontal layout
    return (
      <div className="flex items-center gap-1.5 leading-none">
        <span className={`${sizeStyles.singleLine} text-[#FFFFFF]`}>
          ONE <span className="text-[#7DD3FC]">STORE</span>
        </span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-[#7DD3FC]/15 text-[#7DD3FC] border border-[#7DD3FC]/30 text-[10px] font-extrabold uppercase tracking-wider ml-1">
            {badge}
          </span>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // 3. Container Card Styling (if asCard is active)
  // ---------------------------------------------------------------------------
  const content = (
    <div className={`inline-flex items-center ${sizeStyles.gap} select-none`}>
      {renderIcon()}
      {renderText()}
    </div>
  );

  if (asCard) {
    return (
      <div
        className={`inline-flex items-center ${sizeStyles.gap} px-4 py-2.5 rounded-2xl bg-[#080B10]/90 border border-[#243447] backdrop-blur-md shadow-xl ${className}`}
      >
        {renderIcon()}
        {renderText()}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${sizeStyles.gap} ${className}`}>
      {renderIcon()}
      {renderText()}
    </div>
  );
}
