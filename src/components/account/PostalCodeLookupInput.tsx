"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Check, AlertCircle, Building, MapPin } from "lucide-react";
import { validatePostalCode } from "@/lib/services/profile-validation";
import { type PostalLookupResponse } from "@/app/api/address/lookup/route";

interface PostalCodeLookupInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onResolved: (data: {
    city?: string;
    state?: string;
    district?: string;
    localities?: string[];
    selectedLocality?: string;
    postalCode?: string;
  }) => void;
  country: "IN" | "GB";
  required?: boolean;
  disabled?: boolean;
  selectedLocality?: string;
  onSelectLocality?: (locality: string) => void;
}

export function PostalCodeLookupInput({
  id = "postal-code-lookup",
  label,
  value,
  onChange,
  onResolved,
  country,
  required = true,
  disabled = false,
  selectedLocality = "",
  onSelectLocality,
}: PostalCodeLookupInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState<"idle" | "success" | "warning" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [localities, setLocalities] = useState<string[]>([]);
  const lastLookedUpRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performLookup = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase().replace(/\s+/g, country === "GB" ? " " : "");

      if (!validatePostalCode(clean, country)) {
        setResolvedStatus("idle");
        setStatusMessage(null);
        setLocalities([]);
        return;
      }

      if (lastLookedUpRef.current === `${country}:${clean}`) {
        return;
      }

      setIsLoading(true);
      setStatusMessage("Looking up postal records...");
      setResolvedStatus("idle");

      try {
        const res = await fetch(
          `/api/address/lookup?code=${encodeURIComponent(clean)}&country=${encodeURIComponent(country)}`
        );
        const data: PostalLookupResponse = await res.json();

        lastLookedUpRef.current = `${country}:${clean}`;

        if (data.success) {
          setResolvedStatus("success");
          const locList = data.localities || [];
          setLocalities(locList);

          const feedback =
            country === "IN"
              ? `✓ Resolved ${data.city || ""}, ${data.state || ""} via India Post Directory`
              : `✓ Resolved ${data.city || ""}, ${data.state || ""} via Royal Mail Database`;
          setStatusMessage(feedback);

          onResolved({
            city: data.city,
            state: data.state,
            district: data.district,
            localities: locList,
            selectedLocality: locList.length === 1 ? locList[0] : undefined,
            postalCode: data.postalCode || clean,
          });

          if (locList.length === 1 && onSelectLocality) {
            onSelectLocality(locList[0]);
          }
        } else {
          setResolvedStatus("warning");
          setLocalities([]);
          setStatusMessage(
            data.error ||
              "Postal directory did not return a match. You can enter City and State manually."
          );
        }
      } catch {
        setResolvedStatus("warning");
        setLocalities([]);
        setStatusMessage("Postal lookup service unreachable. You can enter details manually.");
      } finally {
        setIsLoading(false);
      }
    },
    [country, onResolved, onSelectLocality]
  );

  // Trigger lookup automatically when valid code is entered
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const clean = value.trim();

    // Check if code has reached trigger length
    const shouldCheck =
      country === "IN"
        ? clean.length === 6 && /^\d{6}$/.test(clean)
        : clean.length >= 5 && validatePostalCode(clean, "GB");

    if (shouldCheck) {
      debounceTimerRef.current = setTimeout(() => {
        performLookup(clean);
      }, 400);
    } else {
      if (resolvedStatus !== "idle" && clean !== lastLookedUpRef.current.split(":")[1]) {
        setResolvedStatus("idle");
        setStatusMessage(null);
        setLocalities([]);
      }
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, country, performLookup, resolvedStatus]);

  const defaultLabel =
    country === "IN" ? "PIN Code (6 digits)" : "UK Postcode";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[#FFFFFF] uppercase tracking-wider font-semibold text-[11px]"
        >
          {label || defaultLabel} {required && <span className="text-[#7DD3FC]">*</span>}
        </label>
        {resolvedStatus === "success" && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
            <Check className="h-3 w-3" /> Auto-populated
          </span>
        )}
      </div>

      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            // Clean input based on country
            const sanitized =
              country === "IN"
                ? raw.replace(/\D/g, "").slice(0, 6)
                : raw.toUpperCase().slice(0, 8);
            onChange(sanitized);
          }}
          placeholder={country === "IN" ? "e.g. 400050" : "e.g. SW1A 1AA"}
          required={required}
          disabled={disabled}
          maxLength={country === "IN" ? 6 : 8}
          className="w-full h-11 pl-4 pr-10 rounded-xl bg-[#080B10] border border-[#243447] text-[#FFFFFF] font-mono focus:outline-none focus:border-[#7DD3FC] transition-colors text-xs"
        />

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-[#7DD3FC] animate-spin" />
          ) : resolvedStatus === "success" ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : null}
        </div>
      </div>

      {/* Resolution Status / Feedback Badge */}
      {statusMessage && (
        <div
          className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 border transition-all ${
            resolvedStatus === "success"
              ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
              : resolvedStatus === "warning"
              ? "bg-amber-950/30 border-amber-800/60 text-amber-300"
              : "bg-[#102A43]/40 border-[#243447] text-[#9CAFC3]"
          }`}
        >
          {resolvedStatus === "success" ? (
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          )}
          <span className="leading-tight">{statusMessage}</span>
        </div>
      )}

      {/* Locality Selector for PINs mapping to multiple post offices */}
      {localities.length > 1 && (
        <div className="pt-1.5 space-y-1">
          <label className="text-[10px] uppercase font-bold text-[#7DD3FC] flex items-center gap-1">
            <Building className="h-3 w-3" /> Select Your Specific Locality / Post Office:
          </label>
          <div className="relative">
            <select
              value={selectedLocality}
              onChange={(e) => {
                const loc = e.target.value;
                if (onSelectLocality) {
                  onSelectLocality(loc);
                }
              }}
              className="w-full h-9 pl-3 pr-8 rounded-lg bg-[#102A43]/40 border border-[#243447] text-[#FFFFFF] text-xs focus:outline-none focus:border-[#7DD3FC]"
            >
              <option value="">-- Choose your area / delivery branch --</option>
              {localities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-[#9CAFC3]">
            This PIN code serves multiple localities. Selecting yours helps ensure exact courier delivery.
          </p>
        </div>
      )}
    </div>
  );
}
