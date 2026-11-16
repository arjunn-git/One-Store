import { NextResponse } from "next/server";
import { validatePostalCode } from "@/lib/services/profile-validation";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const lookupCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export interface PostalLookupResponse {
  success: boolean;
  country?: "IN" | "GB";
  postalCode?: string;
  city?: string;
  state?: string;
  district?: string;
  localities?: string[];
  multipleLocalities?: boolean;
  source?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * GET /api/address/lookup?pincode=400001
 * High-speed, cached Indian PIN code resolver via India Post directory.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode =
      searchParams.get("pincode") ||
      searchParams.get("postal_code") ||
      searchParams.get("code") ||
      searchParams.get("pin") ||
      searchParams.get("postcode");

    if (!rawCode || !rawCode.trim()) {
      return NextResponse.json<PostalLookupResponse>(
        { success: false, error: "6-digit Indian PIN code is required." },
        { status: 400 }
      );
    }

    const cleanCode = rawCode.trim().replace(/\s+/g, "");

    // Validate format before calling upstream
    if (!validatePostalCode(cleanCode, "IN")) {
      return NextResponse.json<PostalLookupResponse>(
        {
          success: false,
          error: "Invalid 6-digit Indian PIN code format (e.g. 110001).",
        },
        { status: 400 }
      );
    }

    const cacheKey = `IN:${cleanCode}`;
    const cached = lookupCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json<PostalLookupResponse>(cached.data);
    }

    // India Post (api.postalpincode.in)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const upstreamUrl = `https://api.postalpincode.in/pincode/${encodeURIComponent(cleanCode)}`;
      const res = await fetch(upstreamUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "OneStore-Ecommerce/1.0",
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Indian Postal Service returned status ${res.status}`);
      }

      const json = await res.json();
      const records = Array.isArray(json) ? json[0] : null;

      if (!records || records.Status !== "Success" || !Array.isArray(records.PostOffice) || records.PostOffice.length === 0) {
        return NextResponse.json<PostalLookupResponse>(
          {
            success: false,
            country: "IN",
            postalCode: cleanCode,
            error: `No postal records registered for PIN code ${cleanCode}. Please enter your city and state manually.`,
            fallback: true,
          },
          { status: 404 }
        );
      }

      const postOffices = records.PostOffice;
      const first = postOffices[0];

      const localities = Array.from(
        new Set(postOffices.map((po: any) => po.Name?.trim()).filter(Boolean))
      ) as string[];

      const district = first.District?.trim() || "";
      const division = first.Division?.trim() || "";
      const city = district || division;
      const state = first.State?.trim() || "";

      const result: PostalLookupResponse = {
        success: true,
        country: "IN",
        postalCode: cleanCode,
        city,
        state,
        district,
        localities,
        multipleLocalities: localities.length > 1,
        source: "India Post (Postal Pincode Directory)",
      };

      lookupCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json<PostalLookupResponse>(result);
    } catch (err: any) {
      clearTimeout(timeoutId);
      return NextResponse.json<PostalLookupResponse>(
        {
          success: false,
          country: "IN",
          postalCode: cleanCode,
          error: "PIN code lookup service temporarily unavailable. You can enter details manually.",
          fallback: true,
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    return NextResponse.json<PostalLookupResponse>(
      {
        success: false,
        error: err?.message || "Internal server error during PIN code lookup.",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
