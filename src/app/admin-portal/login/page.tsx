"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Store,
} from "lucide-react";
import { OneStoreLogo } from "@/components/brand/OneStoreLogo";

export default function AdminPortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/admin-portal/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    errorParam === "access_denied"
      ? "Access Denied: The account currently signed in does not have administrative privileges."
      : null
  );
  const [lockedTimer, setLockedTimer] = useState<number | null>(null);

  // Countdown timer if rate limited
  useEffect(() => {
    if (lockedTimer === null || lockedTimer <= 0) return;
    const interval = setInterval(() => {
      setLockedTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedTimer && lockedTimer > 0) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.retryAfter) {
          setLockedTimer(data.retryAfter);
          setErrorMsg(data.error);
        } else {
          setErrorMsg(data.error || "Authentication failed. Invalid administrative credentials.");
        }
        setLoading(false);
        return;
      }

      if (data.success) {
        // Hard navigate to dashboard so full session initializes cleanly
        window.location.href = data.redirectTo || nextUrl;
      }
    } catch {
      setErrorMsg("A network communication error occurred. Please verify your connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080B10] px-4 py-12 relative overflow-hidden">
      {/* Subtle luxury ambient backlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#102A43]/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-[#102A43]/50 border border-[#243447] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-3 flex flex-col items-center">
            <OneStoreLogo
              variant="state"
              state="security"
              size="lg"
              badge="ADMIN"
              asCard
            />
            <p className="text-xs text-[#9CAFC3] max-w-xs leading-relaxed">
              Restricted Operations Console — Authorized Credentials Only
            </p>
          </div>

          {/* Access Denied / Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {errorMsg}
                {lockedTimer && lockedTimer > 0 && (
                  <div className="font-bold text-red-300 mt-1">
                    Try again in {lockedTimer} seconds.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold text-[#9CAFC3] uppercase tracking-wider mb-1.5"
              >
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7DD3FC]" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#080B10] border border-[#243447] focus:border-[#7DD3FC] focus:ring-1 focus:ring-[#7DD3FC] rounded-xl text-xs text-[#FFFFFF] placeholder-[#9CAFC3]/60 transition-all outline-none"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#9CAFC3] uppercase tracking-wider mb-1.5"
              >
                Administrative Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7DD3FC]" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-[#080B10] border border-[#243447] focus:border-[#7DD3FC] focus:ring-1 focus:ring-[#7DD3FC] rounded-xl text-xs text-[#FFFFFF] placeholder-[#9CAFC3]/60 transition-all outline-none"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CAFC3] hover:text-[#FFFFFF] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (lockedTimer !== null && lockedTimer > 0)}
              className="w-full py-3.5 px-4 bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7DD3FC]/10 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate &amp; Enter Console</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer security note & storefront link */}
          <div className="pt-4 border-t border-[#243447]/60 flex items-center justify-between text-[11px] text-[#9CAFC3]">
            <div className="flex items-center gap-1 text-[#7DD3FC]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>TLS / AES-256</span>
            </div>
            <Link
              href="/"
              className="flex items-center gap-1 text-[#9CAFC3] hover:text-[#FFFFFF] transition-colors"
            >
              <Store className="h-3 w-3" />
              <span>Public Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
