import { NextResponse } from "next/server";
import { validatePostalCode } from "@/lib/services/profile-validation";

interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory cache to prevent spamming upstream postal directories
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
 * GET /api/address/lookup?code=400050&country=IN
 * Reliable postal / PIN code resolver for India and UK markets.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode =
      searchParams.get("postcode") ||
      searchParams.get("pincode") ||
      searchParams.get("postal_code") ||
      searchParams.get("code") ||
      searchParams.get("pin");
    const country = (searchParams.get("country")?.toUpperCase() === "GB" ? "GB" : "IN") as "IN" | "GB";

    if (!rawCode || !rawCode.trim()) {
      return NextResponse.json<PostalLookupResponse>(
        { success: false, error: "Postal or PIN code is required." },
        { status: 400 }
      );
    }

    const cleanCode = rawCode.trim().toUpperCase().replace(/\s+/g, country === "GB" ? " " : "");

    // Validate format before calling external providers
    if (!validatePostalCode(cleanCode, country)) {
      return NextResponse.json<PostalLookupResponse>(
        {
          success: false,
          error:
            country === "IN"
              ? "Invalid 6-digit Indian PIN code format (e.g. 110001)."
              : "Invalid UK postcode format (e.g. SW1A 1AA).",
        },
        { status: 400 }
      );
    }

    const cacheKey = `${country}:${cleanCode}`;
    const cached = lookupCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json<PostalLookupResponse>(cached.data);
    }

    // 1. INDIA MARKET (api.postalpincode.in)
    if (country === "IN") {
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

        // Collect unique post office / locality names
        const localities = Array.from(
          new Set(postOffices.map((po: any) => po.Name?.trim()).filter(Boolean))
        ) as string[];

        // Extract city (District is standard in India Post, fallback to Division)
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
    }

    // 2. UK MARKET (api.postcodes.io)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const sanitizedUK = cleanCode.replace(/\s+/g, "");
      const upstreamUrl = `https://api.postcodes.io/postcodes/${encodeURIComponent(sanitizedUK)}`;
      const res = await fetch(upstreamUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "OneStore-Ecommerce/1.0",
        },
      });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        return NextResponse.json<PostalLookupResponse>(
          {
            success: false,
            country: "GB",
            postalCode: cleanCode,
            error: `Postcode ${cleanCode} was not found in the Royal Mail National Statistics database.`,
            fallback: true,
          },
          { status: 404 }
        );
      }

      if (!res.ok) {
        throw new Error(`UK Postcodes API returned status ${res.status}`);
      }

      const json = await res.json();
      const r = json.result;

      if (!r) {
        return NextResponse.json<PostalLookupResponse>(
          {
            success: false,
            country: "GB",
            postalCode: cleanCode,
            error: `No details available for UK postcode ${cleanCode}.`,
            fallback: true,
          },
          { status: 404 }
        );
      }

      const city = r.admin_district || r.parish || r.european_electoral_region || "London";
      const state = r.region || r.country || "England";
      const district = r.admin_district || "";
      const localities = Array.from(new Set([r.parish, r.admin_district].filter(Boolean))) as string[];

      const result: PostalLookupResponse = {
        success: true,
        country: "GB",
        postalCode: r.postcode || cleanCode,
        city,
        state,
        district,
        localities,
        multipleLocalities: localities.length > 1,
        source: "Royal Mail / Postcodes.io (National Statistics)",
      };

      lookupCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json<PostalLookupResponse>(result);
    } catch (err: any) {
      clearTimeout(timeoutId);
      return NextResponse.json<PostalLookupResponse>(
        {
          success: false,
          country: "GB",
          postalCode: cleanCode,
          error: "UK postcode service temporarily unavailable. You can enter details manually.",
          fallback: true,
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    return NextResponse.json<PostalLookupResponse>(
      {
        success: false,
        error: err?.message || "Internal server error during postal lookup.",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
