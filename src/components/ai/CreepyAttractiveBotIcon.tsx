"use client";

interface CreepyBotIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isThinking?: boolean;
}

export function CreepyAttractiveBotIcon({
  size = "md",
  className = "",
  isThinking = false,
}: CreepyBotIconProps) {
  const sizeMap = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none group ${dim} ${className}`}
      title="Nocturne • Cybernetic Concierge"
    >
      {/* Ambient Sinister / Alluring Aura */}
      <div
        className={`absolute inset-0 rounded-full blur-md opacity-70 transition-all duration-700 ${
          isThinking
            ? "bg-gradient-to-r from-[#A855F7] via-[#06B6D4] to-[#7DD3FC] scale-125 animate-pulse"
            : "bg-gradient-to-tr from-[#38BDF8]/40 via-[#A855F7]/30 to-[#06B6D4]/40 group-hover:scale-115 group-hover:opacity-100"
        }`}
      />

      {/* Cybernetic Bot Visage SVG */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-[0_0_10px_rgba(125,211,252,0.6)]"
      >
        <defs>
          {/* Obsidian Metallic Gradient */}
          <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#080B10" />
          </linearGradient>

          {/* Hyper-Cyan & Electric Violet Eye Glow */}
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#7DD3FC" />
            <stop offset="85%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
          </radialGradient>

          {/* Sinister Violet Rim */}
          <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Neon Grid Pattern */}
          <pattern id="neuralNet" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#7DD3FC" strokeWidth="0.3" strokeOpacity="0.2" />
          </pattern>
        </defs>

        {/* Outer Halo Ring / Telemetry Orbit */}
        <circle
          cx="32"
          cy="32"
          r="30"
          stroke="url(#rimGrad)"
          strokeWidth="1.2"
          strokeDasharray="4 2 1 3"
          strokeOpacity="0.75"
          className={isThinking ? "animate-spin" : ""}
          style={{ animationDuration: "12s" }}
        />

        {/* Angular Robotic Skull Silhouette */}
        <path
          d="M 32 8 C 18 8 13 18 13 29 C 13 40 20 48 24 53 L 28 56 L 36 56 L 40 53 C 44 48 51 40 51 29 C 51 18 46 8 32 8 Z"
          fill="url(#chassisGrad)"
          stroke="url(#rimGrad)"
          strokeWidth="1.5"
        />

        {/* Forehead Neural Core Visor Accent */}
        <path
          d="M 24 16 L 32 12 L 40 16 L 36 21 L 28 21 Z"
          fill="#0c141e"
          stroke="#7DD3FC"
          strokeWidth="0.8"
          strokeOpacity="0.8"
        />
        <circle cx="32" cy="16" r="1.5" fill="#7DD3FC" className="animate-ping" style={{ animationDuration: "2s" }} />

        {/* Left Piercing Cybernetic Eye (Angled, Slit-Almond, Glowing) */}
        <g className="transition-all duration-300">
          <path
            d="M 19 28 C 22 26 27 27 28 31 C 26 33 21 33 19 28 Z"
            fill="#050810"
            stroke="#7DD3FC"
            strokeWidth="1"
          />
          <ellipse cx="23.5" cy="29.5" rx="3.5" ry="2" fill="url(#eyeGlow)" />
          {/* Intense Vertical Slit Pupil */}
          <ellipse cx="23.5" cy="29.5" rx="0.9" ry="2.2" fill="#080B10" />
          <circle cx="24.2" cy="28.8" r="0.6" fill="#FFFFFF" />
        </g>

        {/* Right Piercing Cybernetic Eye */}
        <g className="transition-all duration-300">
          <path
            d="M 45 28 C 42 26 37 27 36 31 C 38 33 43 33 45 28 Z"
            fill="#050810"
            stroke="#7DD3FC"
            strokeWidth="1"
          />
          <ellipse cx="40.5" cy="29.5" rx="3.5" ry="2" fill="url(#eyeGlow)" />
          {/* Intense Vertical Slit Pupil */}
          <ellipse cx="40.5" cy="29.5" rx="0.9" ry="2.2" fill="#080B10" />
          <circle cx="41.2" cy="28.8" r="0.6" fill="#FFFFFF" />
        </g>

        {/* Biomechanical Cheekbone Inset Grooves */}
        <path d="M 17 38 L 23 44 L 28 44" stroke="#7DD3FC" strokeWidth="0.8" strokeOpacity="0.6" />
        <path d="M 47 38 L 41 44 L 36 44" stroke="#7DD3FC" strokeWidth="0.8" strokeOpacity="0.6" />

        {/* Nose Bridge / Audio Sensor Vents */}
        <path d="M 32 28 L 32 37" stroke="#A855F7" strokeWidth="1" strokeOpacity="0.7" />
        <circle cx="30" cy="38" r="0.8" fill="#7DD3FC" />
        <circle cx="34" cy="38" r="0.8" fill="#7DD3FC" />

        {/* Sinister / Elegant Cyber Mouthplate (Audio Grill) */}
        <path
          d="M 26 48 L 32 50 L 38 48"
          stroke="#7DD3FC"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <line x1="29" y1="46" x2="35" y2="46" stroke="#A855F7" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1="28" y1="52" x2="36" y2="52" stroke="#7DD3FC" strokeWidth="0.8" strokeOpacity="0.5" />

        {/* Chin Sensor Notch */}
        <polygon points="30,55 34,55 32,58" fill="#7DD3FC" />
      </svg>
    </div>
  );
}
