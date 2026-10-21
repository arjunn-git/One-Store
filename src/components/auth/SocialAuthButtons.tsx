"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle, signInWithApple, isAdminEmail } from "@/lib/services/auth";

export function SocialAuthButtons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/account";

  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const onPageShow = () => {
      setLoadingProvider(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const handleGoogle = async () => {
    setLoadingProvider("google");
    setErrorMsg(null);

    const safetyTimer = setTimeout(() => {
      setLoadingProvider(null);
    }, 8000);

    try {
      const res = await signInWithGoogle(nextUrl);
      if (!res.success) {
        clearTimeout(safetyTimer);
        setErrorMsg(res.error || "Google sign-in is not enabled yet in your Supabase dashboard. Please use the Email OTP above.");
        setLoadingProvider(null);
      }
    } catch {
      clearTimeout(safetyTimer);
      setErrorMsg("Google sign-in could not be completed. Please use Email OTP.");
      setLoadingProvider(null);
    }
  };

  const handleApple = async () => {
    setLoadingProvider("apple");
    setErrorMsg(null);

    const safetyTimer = setTimeout(() => {
      setLoadingProvider(null);
    }, 8000);

    try {
      const res = await signInWithApple(nextUrl);
      if (!res.success) {
        clearTimeout(safetyTimer);
        setErrorMsg(res.error || "Sign in with Apple is not enabled yet in your Supabase dashboard. Please use the Email OTP above.");
        setLoadingProvider(null);
      }
    } catch {
      clearTimeout(safetyTimer);
      setErrorMsg("Apple sign-in could not be completed. Please use Email OTP.");
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Official Google Button */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={!!loadingProvider}
        className="w-full h-11 px-4 rounded-xl bg-[#FFFFFF] text-[#1F1F1F] font-semibold text-xs hover:bg-[#F4F8FC] transition-all flex items-center justify-center gap-3 border border-[#243447] disabled:opacity-60 shadow-sm"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>
          {loadingProvider === "google" ? "Connecting to Google..." : "Continue with Google"}
        </span>
      </button>

      {/* Official Apple Button */}
      <button
        type="button"
        onClick={handleApple}
        disabled={!!loadingProvider}
        className="w-full h-11 px-4 rounded-xl bg-[#080B10] text-[#FFFFFF] font-semibold text-xs hover:bg-[#102A43] transition-all flex items-center justify-center gap-3 border border-[#243447] disabled:opacity-60 shadow-sm"
      >
        <svg className="h-4 w-4 shrink-0 fill-current text-[#FFFFFF]" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87 0-.01-.01-.01-.01-.01-.95.04-2.12.64-2.79 1.42-.58.68-1.1 1.76-1.03 2.82.02.01.03.01.04.01 1.05.08 2.18-.62 2.78-1.37z" />
        </svg>
        <span>
          {loadingProvider === "apple" ? "Connecting to Apple..." : "Sign in with Apple"}
        </span>
      </button>
    </div>
  );
}
