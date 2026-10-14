"use client";

import { useState } from "react";
import { sendPhoneOtp } from "@/lib/services/auth";
import { Phone, ArrowRight, ShieldAlert, RefreshCw } from "lucide-react";

export function PhoneOtpTab() {
  const [countryCode, setCountryCode] = useState<"+91" | "+44">("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanNum = phoneNumber.replace(/\D/g, "");
    if (cleanNum.length < 8) {
      setStatusMessage("Please enter a valid mobile number.");
      return;
    }

    const fullE164 = `${countryCode}${cleanNum}`;
    setIsLoading(true);

    const res = await sendPhoneOtp(fullE164);
    setIsLoading(false);

    if (!res.success) {
      setStatusMessage(res.error || "Unable to dispatch mobile SMS code.");
    } else {
      setStatusMessage(`Verification code sent via SMS to ${fullE164}`);
    }
  };

  return (
    <form onSubmit={handleSendPhoneCode} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#FFFFFF] uppercase tracking-wider">
          Mobile Number (India &amp; UK)
        </label>
        <div className="flex gap-2">
          {/* Country Calling Code Selector */}
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value as "+91" | "+44")}
            className="h-12 px-3 rounded-xl bg-[#080B10] border border-[#243447] text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#7DD3FC]"
          >
            <option value="+91">🇮🇳 India (+91)</option>
            <option value="+44">🇬🇧 UK (+44)</option>
          </select>

          {/* Number Input */}
          <div className="relative flex-1">
            <input
              type="tel"
              inputMode="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="98765 43210"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#080B10] border border-[#243447] text-sm text-[#FFFFFF] placeholder-[#9CAFC3] focus:outline-none focus:border-[#7DD3FC]"
            />
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CAFC3]" />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-[#102A43] border border-[#243447] text-xs text-[#9CAFC3] flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 text-[#7DD3FC] shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl bg-[#102A43] text-[#7DD3FC] border border-[#243447] font-semibold text-xs hover:border-[#7DD3FC] hover:text-[#FFFFFF] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <span>Send SMS Code</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-[11px] text-[#9CAFC3] text-center leading-relaxed">
        Standard carrier SMS charges may apply. SMS OTP requires a configured SMS provider (e.g. Twilio / MessageBird) in the Supabase dashboard.
      </p>
    </form>
  );
}
