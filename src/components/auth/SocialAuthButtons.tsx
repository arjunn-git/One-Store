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
        <svg className="h-4 w-4" viewBox="0 0 24 24">
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
        <svg className="h-4 w-4 fill-current text-[#FFFFFF]" viewBox="0 0 170 170">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.71-11.65-14.01-6.19-9.59-11.02-20.08-14.49-31.48-3.47-11.4-5.21-22.3-5.21-32.71 0-14.02 3.4-25.75 10.2-35.18 6.8-9.43 15.42-14.28 25.86-14.54 4.89 0 10.15 1.25 15.78 3.75 5.63 2.5 9.4 3.8 11.3 3.91 1.53-.11 5.48-1.46 11.87-4.04 6.38-2.58 11.75-3.72 16.11-3.42 12.18.87 21.78 5.17 28.79 12.91-10.87 6.64-16.19 15.69-15.96 27.16.22 9.03 3.69 16.65 10.42 22.86 6.72 6.2 14.65 9.87 23.77 11.01-1.95 6.09-4.35 12.21-7.21 18.36zM119.22 33.15c0-7.18 2.61-13.93 7.82-20.25 5.21-6.32 11.64-10.45 19.3-12.4 1.09 7.4-1.2 14.4-6.85 20.99-5.66 6.58-12.42 10.47-20.27 11.66z" />
        </svg>
        <span>
          {loadingProvider === "apple" ? "Connecting to Apple..." : "Sign in with Apple"}
        </span>
      </button>
    </div>
  );
}
