"use client";

import React, { useId } from "react";

export type OrbState = "idle" | "hover" | "thinking" | "listening" | "speaking" | "error";

export interface SiriOrbProps {
  state?: OrbState;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  audioLevel?: number; // 0.0 to 1.0 (reactive mic or audio amplitude)
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const SIZE_MAP = {
  xs: 24,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

export function SiriOrb({
  state = "idle",
  size = "md",
  audioLevel = 0,
  className = "",
  onClick,
  interactive = false,
}: SiriOrbProps) {
  const uid = useId().replace(/:/g, "_");
  const px = SIZE_MAP[size];

  // Dynamic scale and ripple calculations based on real audio level (0 to 1)
  const clampedLevel = Math.max(0, Math.min(1, audioLevel));
  const audioScale = 1 + clampedLevel * 0.28;
  const rippleOpacity = Math.min(0.85, 0.2 + clampedLevel * 0.7);

  // Determine animation speeds and glow hues based on state
  const isThinking = state === "thinking";
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isError = state === "error";

  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`One Store AI Siri Orb (${state})`}
      className={`relative inline-flex items-center justify-center shrink-0 select-none group transition-transform duration-300 ${
        interactive ? "cursor-pointer hover:scale-105 active:scale-95" : ""
      } ${className}`}
      style={{
        width: px,
        height: px,
      }}
    >
      <style jsx>{`
        @keyframes siri-breathe {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.88;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }
        @keyframes siri-spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes siri-spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        @keyframes siri-pulse-thinking {
          0%, 100% {
            transform: scale(0.92) rotate(0deg);
            filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.7))
              drop-shadow(0 0 20px rgba(168, 85, 247, 0.5));
          }
          50% {
            transform: scale(1.1) rotate(180deg);
            filter: drop-shadow(0 0 16px rgba(0, 240, 255, 0.9))
              drop-shadow(0 0 30px rgba(192, 132, 252, 0.8));
          }
        }
        @keyframes siri-wave-glow {
          0%, 100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.95;
            transform: scale(1.15);
          }
        }
        @keyframes siri-flow-mesh {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-3%, 3%) scale(1.08);
          }
          66% {
            transform: translate(3%, -3%) scale(0.96);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        .orb-breathe {
          animation: siri-breathe 4.5s ease-in-out infinite;
        }
        .orb-spin-clockwise {
          animation: siri-spin-slow ${isThinking ? "3s" : "18s"} linear infinite;
        }
        .orb-spin-counter {
          animation: siri-spin-reverse ${isThinking ? "2.2s" : "14s"} linear infinite;
        }
        .orb-thinking-core {
          animation: siri-pulse-thinking 2s ease-in-out infinite;
        }
        .orb-listening-wave {
          animation: siri-wave-glow 1.2s ease-in-out infinite;
        }
        .orb-flow-gradient {
          animation: siri-flow-mesh ${isThinking ? "2.5s" : "8s"} ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .orb-breathe,
          .orb-spin-clockwise,
          .orb-spin-counter,
          .orb-thinking-core,
          .orb-listening-wave,
          .orb-flow-gradient {
            animation: none !important;
          }
        }
      `}</style>

      {/* Reactive Audio Ripple Rings for Listening & Speaking states */}
      {(isListening || isSpeaking) && (
        <>
          <div
            className="absolute inset-0 rounded-full border border-[#00F0FF]/50 pointer-events-none transition-transform duration-75"
            style={{
              transform: `scale(${1.25 + clampedLevel * 0.45})`,
              opacity: rippleOpacity,
              boxShadow: `0 0 ${12 + clampedLevel * 20}px rgba(0, 240, 255, ${0.4 + clampedLevel * 0.5})`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full border border-[#A855F7]/40 pointer-events-none transition-transform duration-100"
            style={{
              transform: `scale(${1.45 + clampedLevel * 0.6})`,
              opacity: rippleOpacity * 0.6,
              boxShadow: `0 0 ${16 + clampedLevel * 25}px rgba(168, 85, 247, ${0.3 + clampedLevel * 0.4})`,
            }}
          />
        </>
      )}

      {/* Ambient Outer Halo Bloom */}
      <div
        className={`absolute inset-0 rounded-full pointer-events-none blur-lg transition-all duration-500 ${
          isError
            ? "bg-rose-500/40"
            : isThinking
            ? "bg-gradient-to-tr from-[#00F0FF]/60 via-[#38BDF8]/50 to-[#A855F7]/60"
            : isListening
            ? "bg-gradient-to-tr from-[#00F0FF]/70 via-[#3B82F6]/60 to-[#A855F7]/60"
            : "bg-gradient-to-tr from-[#0284C7]/40 via-[#00F0FF]/30 to-[#818CF8]/35"
        }`}
        style={{
          transform: `scale(${isListening || isSpeaking ? audioScale * 1.15 : 1})`,
        }}
      />

      {/* Main Multi-Layered SVG Orb */}
      <svg
        viewBox="0 0 100 100"
        className={`relative z-10 w-full h-full overflow-visible ${
          isThinking ? "orb-thinking-core" : "orb-breathe"
        }`}
        style={{
          transform: isListening || isSpeaking ? `scale(${audioScale})` : undefined,
          transition: "transform 80ms ease-out",
        }}
      >
        <defs>
          {/* Base Dark Core Gradient */}
          <radialGradient id={`${uid}_baseCore`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#08101C" />
            <stop offset="65%" stopColor="#040810" />
            <stop offset="100%" stopColor="#020408" />
          </radialGradient>

          {/* Fluid Cyan-Electric Plasma Gradient */}
          <linearGradient id={`${uid}_cyanFlow`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#0284C7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </linearGradient>

          {/* Electric Blue & Indigo Trail */}
          <linearGradient id={`${uid}_blueTrail`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#3B82F6" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
          </linearGradient>

          {/* Royal Violet & Magenta Accent */}
          <linearGradient id={`${uid}_violetAccent`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#C084FC" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>

          {/* Glass Specular Glare */}
          <linearGradient id={`${uid}_glassGlare`} x1="0%" y1="0%" x2="50%" y2="80%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Soft Blur Filter for Internal Siri Fluidity */}
          <filter id={`${uid}_fluidGlow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Orb Mask for Spherical Containment */}
          <clipPath id={`${uid}_sphereClip`}>
            <circle cx="50" cy="50" r="42" />
          </clipPath>
        </defs>

        {/* 1. Outer Flowing Orbital Light Trails */}
        <g className="orb-spin-clockwise" style={{ transformOrigin: "50px 50px" }}>
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={`url(#${uid}_cyanFlow)`}
            strokeWidth={isThinking ? "2.4" : "1.6"}
            strokeDasharray="45 15 20 25"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>

        <g className="orb-spin-counter" style={{ transformOrigin: "50px 50px" }}>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={`url(#${uid}_violetAccent)`}
            strokeWidth={isThinking ? "2.2" : "1.4"}
            strokeDasharray="30 25 35 15"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* 2. Main Spherical Plasma Body (Clipped inside Circle) */}
        <g clipPath={`url(#${uid}_sphereClip)`}>
          {/* Base Dark Glass Core */}
          <circle cx="50" cy="50" r="42" fill={`url(#${uid}_baseCore)`} />

          {/* Internal Fluid Flow Layers (Siri-style overlapping plasma meshes) */}
          <g className="orb-flow-gradient" style={{ transformOrigin: "50px 50px" }}>
            {/* Cyan Wave Blob */}
            <path
              d="M20,40 Q35,15 65,22 Q90,30 82,58 Q72,85 45,80 Q15,75 20,40 Z"
              fill={`url(#${uid}_cyanFlow)`}
              filter={`url(#${uid}_fluidGlow)`}
              opacity={isError ? "0.2" : "0.75"}
            />

            {/* Electric Blue Wave Blob */}
            <path
              d="M30,30 Q60,10 75,35 Q92,60 70,80 Q45,95 25,70 Q10,50 30,30 Z"
              fill={`url(#${uid}_blueTrail)`}
              filter={`url(#${uid}_fluidGlow)`}
              opacity={isError ? "0.2" : "0.7"}
            />

            {/* Violet/Magenta Wave Blob */}
            <path
              d="M40,25 Q70,20 80,48 Q88,75 55,78 Q28,82 22,55 Q18,30 40,25 Z"
              fill={`url(#${uid}_violetAccent)`}
              filter={`url(#${uid}_fluidGlow)`}
              opacity={isError ? "0.8" : "0.65"}
            />
          </g>

          {/* Deep Center Core Glow */}
          <circle
            cx="50"
            cy="50"
            r={isListening || isSpeaking ? 16 + clampedLevel * 8 : 14}
            fill={isError ? "#F43F5E" : "#00F0FF"}
            opacity={isThinking ? "0.9" : "0.75"}
            filter={`url(#${uid}_fluidGlow)`}
          />

          <circle
            cx="50"
            cy="50"
            r={isListening || isSpeaking ? 8 + clampedLevel * 4 : 7}
            fill="#FFFFFF"
            opacity={isThinking ? "0.95" : "0.85"}
          />

          {/* Realistic Specular Glare / Glass Reflection */}
          <ellipse
            cx="38"
            cy="28"
            rx="22"
            ry="14"
            fill={`url(#${uid}_glassGlare)`}
            transform="rotate(-25 38 28)"
          />
        </g>

        {/* 3. Outer Glass Rim Ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.2"
        />

        {/* Dynamic Sinusoidal Waveform Overlay for Listening or Speaking */}
        {(isListening || isSpeaking) && (
          <g>
            <path
              d={`M 15 50 Q 32.5 ${50 - clampedLevel * 24} 50 50 T 85 50`}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d={`M 20 50 Q 35 ${50 + clampedLevel * 18} 50 50 T 80 50`}
              fill="none"
              stroke="#A855F7"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
