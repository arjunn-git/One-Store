import { NextResponse } from "next/server";

interface CacheEntry {
  data: RealTimeMapDataResponse;
  timestamp: number;
}

const reverseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export interface RealTimeMapDataResponse {
  success: boolean;
  coordinates: {
    lat: number;
    lon: number;
  };
  displayName: string;
  street?: string;
  houseNumber?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country: "IN" | "GB";
  countryName: string;
  boundingbox?: [number, number, number, number];
  attribution: string;
  error?: string;
  fallback?: boolean;
}

/**
 * GET /api/address/reverse?lat=28.6139&lon=77.2090
 * Fetches real-time reverse geocoded map data using OpenStreetMap Nominatim
 * with Photon fallback, in-memory caching, and zero third-party client dependencies.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat") || searchParams.get("latitude");
    const lonStr = searchParams.get("lon") || searchParams.get("lng") || searchParams.get("longitude");

    if (!latStr || !lonStr) {
      return NextResponse.json<RealTimeMapDataResponse>(
        {
          success: false,
          coordinates: { lat: 0, lon: 0 },
          displayName: "",
          country: "IN",
          countryName: "India",
          attribution: "OpenStreetMap",
          error: "Latitude and longitude query parameters are required.",
        },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json<RealTimeMapDataResponse>(
        {
          success: false,
          coordinates: { lat: 0, lon: 0 },
          displayName: "",
          country: "IN",
          countryName: "India",
          attribution: "OpenStreetMap",
          error: "Invalid latitude or longitude values.",
        },
        { status: 400 }
      );
    }

    // Cache key rounded to ~11 meters (4 decimal places)
    const cacheKey = `${lat.toFixed(4)}:${lon.toFixed(4)}`;
    const cached = reverseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json<RealTimeMapDataResponse>(cached.data);
    }

    // 1. Primary Provider: OpenStreetMap Nominatim Reverse API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
      nominatimUrl.searchParams.set("format", "jsonv2");
      nominatimUrl.searchParams.set("lat", lat.toString());
      nominatimUrl.searchParams.set("lon", lon.toString());
      nominatimUrl.searchParams.set("zoom", "18");
      nominatimUrl.searchParams.set("addressdetails", "1");

      const res = await fetch(nominatimUrl.toString(), {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "OneStore-Ecommerce/1.0 (support@onestore.com)",
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const addr = json?.address || {};

        const cCodeRaw = (addr.country_code || "").toUpperCase();
        const country: "IN" | "GB" = cCodeRaw === "GB" || cCodeRaw === "UK" ? "GB" : "IN";

        const street =
          addr.road ||
          addr.pedestrian ||
          addr.street ||
          addr.footway ||
          addr.path ||
          addr.neighbourhood ||
          "";

        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.village ||
          addr.hamlet ||
          addr.district ||
          "";

        const city =
          addr.city ||
          addr.town ||
          addr.municipality ||
          addr.county ||
          addr.state_district ||
          "";

        const district = addr.state_district || addr.county || addr.district || "";
        const state = addr.state || addr.province || addr.region || "";
        const postalCode = addr.postcode || "";
        const houseNumber = addr.house_number || addr.housenumber || "";

        let bbox: [number, number, number, number] | undefined = undefined;
        if (Array.isArray(json?.boundingbox) && json.boundingbox.length === 4) {
          bbox = [
            parseFloat(json.boundingbox[0]),
            parseFloat(json.boundingbox[1]),
            parseFloat(json.boundingbox[2]),
            parseFloat(json.boundingbox[3]),
          ];
        }

        const result: RealTimeMapDataResponse = {
          success: true,
          coordinates: { lat, lon },
          displayName: json.display_name || [street, locality, city, state, postalCode].filter(Boolean).join(", "),
          street: street || undefined,
          houseNumber: houseNumber || undefined,
          locality: locality || undefined,
          city: city || undefined,
          district: district || undefined,
          state: state || undefined,
          postalCode: postalCode || undefined,
          country,
          countryName: addr.country || (country === "GB" ? "United Kingdom" : "India"),
          boundingbox: bbox,
          attribution: "© OpenStreetMap contributors, ODbL 1.0",
        };

        reverseCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return NextResponse.json<RealTimeMapDataResponse>(result);
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // 2. Secondary Fallback Provider: Photon Komoot Reverse API
    try {
      const photonController = new AbortController();
      const pTimeout = setTimeout(() => photonController.abort(), 4000);

      const photonUrl = new URL("https://photon.komoot.io/reverse");
      photonUrl.searchParams.set("lat", lat.toString());
      photonUrl.searchParams.set("lon", lon.toString());

      const pRes = await fetch(photonUrl.toString(), {
        signal: photonController.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "OneStore-Ecommerce/1.0",
        },
      });
      clearTimeout(pTimeout);

      if (pRes.ok) {
        const pJson = await pRes.json();
        const feat = pJson?.features?.[0];
        if (feat) {
          const p = feat.properties || {};
          const cCode = (p.countrycode || "").toUpperCase();
          const country: "IN" | "GB" = cCode === "GB" || cCode === "UK" ? "GB" : "IN";

          const result: RealTimeMapDataResponse = {
            success: true,
            coordinates: { lat, lon },
            displayName: [p.name, p.street, p.city, p.state, p.postcode].filter(Boolean).join(", "),
            street: p.street || p.name || undefined,
            houseNumber: p.housenumber || undefined,
            locality: p.district || p.locality || undefined,
            city: p.city || undefined,
            district: p.district || undefined,
            state: p.state || undefined,
            postalCode: p.postcode || undefined,
            country,
            countryName: p.country || (country === "GB" ? "United Kingdom" : "India"),
            attribution: "© OpenStreetMap / Photon contributors",
            fallback: true,
          };

          reverseCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return NextResponse.json<RealTimeMapDataResponse>(result);
        }
      }
    } catch {
      // Continue to final coordinates-only response
    }

    // If reverse services are unreachable, return real-time coordinates gracefully
    const fallbackResponse: RealTimeMapDataResponse = {
      success: true,
      coordinates: { lat, lon },
      displayName: `GPS Location (${lat.toFixed(5)}°, ${lon.toFixed(5)}°)`,
      country: "IN",
      countryName: "India",
      attribution: "OpenStreetMap Real-time GPS",
      fallback: true,
      error: "Reverse geocoding temporarily slow. GPS coordinates captured successfully.",
    };

    return NextResponse.json<RealTimeMapDataResponse>(fallbackResponse);
  } catch (err: any) {
    return NextResponse.json<RealTimeMapDataResponse>(
      {
        success: false,
        coordinates: { lat: 0, lon: 0 },
        displayName: "",
        country: "IN",
        countryName: "India",
        attribution: "OpenStreetMap",
        error: err?.message || "Internal server error fetching map data.",
      },
      { status: 500 }
    );
  }
}
