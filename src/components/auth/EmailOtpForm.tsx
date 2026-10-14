"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  sendLoginOtp,
  sendSignupOtp,
  verifyEmailOtp,
  maskEmail,
  isAdminEmail,
} from "@/lib/services/auth";
import { OtpInput } from "./OtpInput";
import { SocialAuthButtons } from "./SocialAuthButtons";
import { Mail, ArrowRight, ShieldCheck, RefreshCw, Edit2, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface EmailOtpFormProps {
  mode: "login" | "signup";
}

export function EmailOtpForm({ mode }: EmailOtpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/account";

  // Form Inputs
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // OTP State
  const [step, setStep] = useState<"input" | "verify">("input");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "verify" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Handle Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (mode === "signup" && !acceptTerms) {
      setErrorMessage("You must accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setIsLoading(true);

    const res =
      mode === "signup"
        ? await sendSignupOtp(trimmedEmail, fullName.trim(), marketingConsent)
        : await sendLoginOtp(trimmedEmail);

    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Unable to send verification code. Please try again.");
      return;
    }

    setStep("verify");
    setCountdown(60);
    setOtpCode("");
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpCode.length !== 6) {
      setErrorMessage("Please enter all 6 digits of your verification code.");
      return;
    }

    setIsLoading(true);

    const res = await verifyEmailOtp(
      email.trim().toLowerCase(),
      otpCode,
      mode === "signup" ? "signup" : "email"
    );

    if (!res.success) {
      setIsLoading(false);
      setErrorMessage(res.error || "Verification failed. The code may be invalid or expired.");
      return;
    }

    setIsSuccess(true);

    // Success redirect: Hard navigation guarantees server components and cookies sync cleanly
    const target =
      isAdminEmail(email.trim().toLowerCase()) && (nextUrl === "/account" || !nextUrl || nextUrl === "/")
        ? "/admin"
        : nextUrl;

    setTimeout(() => {
      window.location.href = target;
    }, 600);
  };

  // Handle Resend
  const handleResend = async () => {
    if (countdown > 0 || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    const res =
      mode === "signup"
        ? await sendSignupOtp(email.trim().toLowerCase(), fullName.trim(), marketingConsent)
        : await sendLoginOtp(email.trim().toLowerCase());

    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || "Resend failed. Please wait a moment.");
      return;
    }

    setCountdown(60);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-[#102A43]/50 border border-[#243447] shadow-2xl backdrop-blur-sm">
      {/* Step 1: Email Form */}
      {step === "input" ? (
        <form onSubmit={handleSendCode} className="space-y-6">
          <div className="text-center space-y-1.5 mb-6">
            <h2 className="text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
              {mode === "signup" ? "Create One Store Account" : "Welcome Back"}
            </h2>
            <p className="text-xs text-[#9CAFC3]">
              {mode === "signup"
                ? "Passwordless access for customers in India & the UK."
                : "Enter your registered email for an instant 6-digit verification code."}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name (Signup only) */}
          {mode === "signup" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Arjun Taneja"
                className="w-full h-12 px-4 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC] transition-colors"
              />
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC] transition-colors"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
            </div>
          </div>

          {/* Signup Checkboxes */}
          {mode === "signup" && (
            <div className="space-y-3 pt-2 text-xs text-[#9CAFC3]">
              {/* Terms (Required) */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#243447] bg-[#080B10] text-[#7DD3FC] focus:ring-0"
                />
                <span className="leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#7DD3FC] hover:underline" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#7DD3FC] hover:underline" target="_blank">
                    Privacy Policy
                  </Link>
                  . <span className="text-red-400">*</span>
                </span>
              </label>

              {/* Marketing (Optional & Unchecked by default) */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#243447] bg-[#080B10] text-[#7DD3FC] focus:ring-0"
                />
                <span className="leading-relaxed">
                  Keep me updated on exclusive flagship releases, dual-market shipping promotions,
                  and curated offers. (Optional)
                </span>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-sm hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{mode === "signup" ? "Continue to Verification" : "Send Login Code"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#243447]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider text-[#9CAFC3]">
              <span className="bg-[#102A43] px-3">or continue with</span>
            </div>
          </div>

          {/* Social Auth */}
          <SocialAuthButtons />

          {/* Switch Mode Link */}
          <div className="text-center pt-2 text-xs text-[#9CAFC3]">
            {mode === "signup" ? (
              <span>
                Already have an account?{" "}
                <Link href="/login" className="text-[#7DD3FC] font-semibold hover:underline">
                  Log in with Email OTP
                </Link>
              </span>
            ) : (
              <span>
                Don't have an account yet?{" "}
                <Link href="/signup" className="text-[#7DD3FC] font-semibold hover:underline">
                  Create One Store Account
                </Link>
              </span>
            )}
          </div>
        </form>
      ) : (
        /* Step 2: Branded OTP Verification Screen */
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="text-center space-y-2 mb-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#080B10] border border-[#243447] flex items-center justify-center text-[#7DD3FC] shadow-inner mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
              Verify your identity
            </h2>
            <p className="text-xs text-[#9CAFC3]">
              We have dispatched a 6-digit verification code to:
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#080B10] border border-[#243447] text-xs font-mono text-[#7DD3FC]">
              <span>{maskEmail(email)}</span>
              <button
                type="button"
                onClick={() => setStep("input")}
                className="text-[#9CAFC3] hover:text-[#FFFFFF] ml-1"
                title="Edit email"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          {isSuccess ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-600 text-xs text-emerald-200 text-center space-y-1 animate-fade-in shadow-lg">
              <div className="font-semibold flex items-center justify-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Verification Successful</span>
              </div>
              <p className="text-[11px] text-emerald-200/90">
                Synchronizing your credentials and loading your account...
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#080B10] border border-[#243447] text-[11px] text-[#9CAFC3] text-center">
              Please enter the 6-digit OTP code sent to your email. Check your spam folder if it doesn't appear in 1 minute.
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 6-Digit OTP Input */}
          <div className="py-2">
            <OtpInput
              value={otpCode}
              onChange={setOtpCode}
              disabled={isLoading}
              hasError={!!errorMessage}
            />
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading || otpCode.length !== 6}
            className="w-full h-12 rounded-xl bg-[#7DD3FC] text-[#080B10] font-semibold text-sm hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Verify and Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Resend & Edit Email Controls */}
          <div className="flex items-center justify-between pt-2 text-xs text-[#9CAFC3] border-t border-[#243447]/60">
            <button
              type="button"
              onClick={() => setStep("input")}
              className="hover:text-[#FFFFFF] transition-colors"
            >
              ← Edit Email
            </button>

            <div>
              {countdown > 0 ? (
                <span>Resend code in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-[#7DD3FC] font-semibold hover:underline"
                >
                  Resend 6-Digit Code
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
