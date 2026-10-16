"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { OneStoreLogo } from "@/components/brand/OneStoreLogo";

export function WelcomeScreen() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [currentTask, setCurrentTask] = useState<string>("Preparing your store...");
  const [progress, setProgress] = useState<number>(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const runInitialization = useCallback(async () => {
    setErrorMessage(null);
    setIsExiting(false);

    try {
      // 1. Task 1: Store & Market Setup
      setCurrentTask("Preparing your store...");
      setProgress(15);
      await new Promise((resolve) => setTimeout(resolve, 80));

      // 2. Task 2: Real Catalogue & Product Cache Fetch
      setCurrentTask("Loading products and prices...");
      setProgress(40);
      const storeRes = await fetch("/api/store/init", {
        headers: { Accept: "application/json" },
      });

      if (!storeRes.ok) {
        throw new Error("Catalogue service temporarily unavailable.");
      }
      await storeRes.json();
      setProgress(60);

      // 3. Task 3: Real Session Restoration
      setCurrentTask("Restoring your session...");
      setProgress(75);
      try {
        const sessionRes = await fetch("/api/auth/session", {
          headers: { Accept: "application/json" },
        });
        if (sessionRes.ok) {
          await sessionRes.json();
        }
      } catch {
        // Non-blocking: continue as guest if offline
      }
      setProgress(85);

      // 4. Task 4: Storefront & Cart Experience
      setCurrentTask("Preparing your shopping experience...");
      setProgress(95);
      await new Promise((resolve) => setTimeout(resolve, 60));

      // 5. Task 5: All Set!
      setCurrentTask("You're all set!");
      setProgress(100);

      try {
        sessionStorage.setItem("one_store_initial_init_done", "true");
      } catch {
        // Ignore private browsing storage restrictions
      }

      // Smooth exit transition
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 400);
      }, 350);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to store services.";
      setErrorMessage(msg);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Check reduced motion accessibility preference
    if (typeof window !== "undefined") {
      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(motionQuery.matches);
    }

    // Check if initial load already occurred in this session to prevent flash on internal routes
    let alreadyInitialized = false;
    try {
      alreadyInitialized = sessionStorage.getItem("one_store_initial_init_done") === "true";
    } catch {
      alreadyInitialized = false;
    }

    // Do not show welcome loader on dedicated admin portal
    if (pathname && (pathname === "/admin-portal" || pathname.startsWith("/admin-portal/"))) {
      setIsVisible(false);
      return;
    }

    if (alreadyInitialized) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    runInitialization();
  }, [runInitialization, pathname]);

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#080B10] select-none transition-all duration-500 ease-out ${
        isExiting
          ? reducedMotion
            ? "opacity-0"
            : "opacity-0 scale-95 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[320px] bg-[#7DD3FC]/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[250px] bg-[#102A43]/40 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 relative z-10">
        {/* 1. ONE STORE Dynamic Logo */}
        <OneStoreLogo
          variant={progress >= 100 ? "state" : errorMessage ? "state" : "loading"}
          state={progress >= 100 ? "success" : errorMessage ? "error" : "default"}
          size="md"
          asCard
        />

        {/* 2. Showcase Image Card (matching reference visual) */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/10.5] rounded-3xl bg-gradient-to-b from-[#102A43]/50 via-[#0c141e]/90 to-[#080B10] border border-[#243447] overflow-hidden p-2 shadow-2xl group">
          {/* Subtle Glass highlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-3xl" />

          {/* Product showcase image */}
          <div className="w-full h-full rounded-2xl overflow-hidden relative flex items-center justify-center bg-[#080B10]">
            <img
              src="/images/welcome-showcase.png"
              alt="One Store Flagship Acoustics & Precision Wearables"
              className="w-full h-full object-cover rounded-2xl"
              fetchPriority="high"
            />
          </div>

          {/* Bottom subtle ambient accent line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#7DD3FC]/50 to-transparent" />
        </div>

        {/* 3. Headline & Dynamic Supporting Task */}
        <div className="space-y-2 pt-1 w-full">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FFFFFF]">
            Good things are loading.
          </h1>

          {/* Dynamic supporting text linked to actual initialization events */}
          <div className="h-6 flex items-center justify-center">
            {errorMessage ? (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : progress === 100 ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-fade-in">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{currentTask}</span>
              </div>
            ) : (
              <p className="text-xs text-[#9CAFC3] font-medium tracking-wide transition-all duration-300">
                {currentTask}
              </p>
            )}
          </div>
        </div>

        {/* 4. Slim Progress Bar & Percentage */}
        <div className="w-full max-w-xs space-y-2 pt-1">
          {errorMessage ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={runInitialization}
                className="px-5 py-2 rounded-xl bg-[#7DD3FC] text-[#080B10] font-bold text-xs hover:bg-[#FFFFFF] transition-all shadow-lg shadow-[#7DD3FC]/20 flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          ) : (
            <>
              {/* Slim Progress Track */}
              <div className="w-full h-1 bg-[#102A43] rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all ease-out shadow-sm ${
                    reducedMotion ? "" : "duration-300"
                  } ${
                    progress === 100
                      ? "bg-emerald-400 shadow-emerald-400/50"
                      : "bg-gradient-to-r from-[#7DD3FC]/60 via-[#7DD3FC] to-[#FFFFFF] shadow-[#7DD3FC]/50"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Progress Percentage */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#9CAFC3] px-0.5">
                <span>Initialization</span>
                <span className="font-bold text-[#7DD3FC]">{progress}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
