"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, LogOut, ShieldAlert } from "lucide-react";

export default function AdminPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to console with telemetry context
    console.error("Admin Portal Runtime Boundary Caught Error:", error);
  }, [error]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin-portal/logout", { method: "POST" });
    } catch {
      // Continue navigation
    }
    window.location.href = "/admin-portal/login";
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-[#102A43]/50 border border-[#243447] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Operations Center Safeguard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#FFFFFF] tracking-tight">
            Dashboard View Interrupted
          </h1>
          <p className="text-xs text-[#9CAFC3] max-w-md mx-auto leading-relaxed">
            The administrative command center caught an unexpected rendering state. The application remains fully secure and operational.
          </p>
        </div>

        {error.message && (
          <div className="p-3.5 rounded-xl bg-[#080B10] border border-[#243447] text-left text-xs font-mono text-amber-200/80 break-all overflow-x-auto max-h-32">
            <span className="text-[#9CAFC3] font-sans block mb-1 font-semibold uppercase text-[10px]">
              Diagnostic Trace:
            </span>
            {error.message}
            {error.digest && (
              <span className="block text-[10px] text-[#9CAFC3] mt-1 font-mono">
                Digest: {error.digest}
              </span>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7DD3FC] hover:bg-[#FFFFFF] text-[#080B10] font-bold text-xs transition-all shadow-lg shadow-[#7DD3FC]/10 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Recover Operations</span>
          </button>

          <Link
            href="/admin-portal/orders"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#7DD3FC] hover:text-[#080B10] text-[#7DD3FC] border border-[#243447] font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Open Orders Console</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
