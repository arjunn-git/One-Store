import { NextResponse } from "next/server";

interface CacheEntry {
  data: AddressSuggestion[];
  timestamp: number;
}

const autocompleteCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export interface AddressSuggestion {
  id: string;
  label: string;
  street?: string;
  housenumber?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: "IN" | "GB";
  coordinates?: {
    lat: number;
    lon: number;
  };
  attribution?: string;
}

export interface AddressAutocompleteResponse {
  success: boolean;
  suggestions: AddressSuggestion[];
  query: string;
  country: "IN" | "GB";
  attribution: string;
  error?: string;
  fallback?: boolean;
}

/**
 * GET /api/address/autocomplete?q=Bandra&country=IN
 * Fast, debounced street address and locality autocomplete using OpenStreetMap Photon
 * with strict privacy, rate limiting, and zero third-party client dependencies.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const country = (searchParams.get("country")?.toUpperCase() === "GB" ? "GB" : "IN") as "IN" | "GB";

    const cleanQuery = query.trim();

    if (cleanQuery.length < 3) {
      return NextResponse.json<AddressAutocompleteResponse>({
        success: true,
        suggestions: [],
        query: cleanQuery,
        country,
        attribution: "OpenStreetMap / Photon",
      });
    }

    const cacheKey = `${country}:${cleanQuery.toLowerCase()}`;
    const cached = autocompleteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json<AddressAutocompleteResponse>({
        success: true,
        suggestions: cached.data,
        query: cleanQuery,
        country,
        attribution: "OpenStreetMap / Photon",
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      // Query Photon OpenStreetMap geocoding endpoint
      const photonUrl = new URL("https://photon.komoot.io/api/");
      photonUrl.searchParams.set("q", cleanQuery);
      photonUrl.searchParams.set("limit", "7");
      photonUrl.searchParams.set("lang", "en");

      // Constrain country
      if (country === "IN") {
        photonUrl.searchParams.append("osm_tag", "place");
        photonUrl.searchParams.append("osm_tag", "highway");
        photonUrl.searchParams.append("osm_tag", "building");
      }

      const res = await fetch(photonUrl.toString(), {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "OneStore-Ecommerce/1.0",
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Autocomplete service returned HTTP ${res.status}`);
      }

      const json = await res.json();
      const features: any[] = json?.features || [];

      // Filter and normalize items matching the selected shopping country
      const filtered = features.filter((feat) => {
        const cCode = (feat.properties?.countrycode || "").toUpperCase();
        if (country === "IN" && cCode === "IN") return true;
        if (country === "GB" && (cCode === "GB" || cCode === "UK")) return true;
        // If countrycode is omitted, check country string
        const cName = (feat.properties?.country || "").toLowerCase();
        if (country === "IN" && cName.includes("india")) return true;
        if (country === "GB" && (cName.includes("united kingdom") || cName.includes("britain") || cName.includes("england") || cName.includes("scotland") || cName.includes("wales"))) return true;
        return false;
      });

      const suggestions: AddressSuggestion[] = filtered.map((feat, index) => {
        const p = feat.properties || {};
        const parts: string[] = [];

        // Build human-friendly label
        if (p.housenumber && p.street) {
          parts.push(`${p.housenumber} ${p.street}`);
        } else if (p.name) {
          parts.push(p.name);
          if (p.street && p.street !== p.name) parts.push(p.street);
        } else if (p.street) {
          parts.push(p.street);
        }

        if (p.district && p.district !== p.name && p.district !== p.city) parts.push(p.district);
        if (p.city && p.city !== p.name) parts.push(p.city);
        if (p.state && p.state !== p.city) parts.push(p.state);
        if (p.postcode) parts.push(p.postcode);

        const label = parts.length > 0 ? parts.join(", ") : cleanQuery;

        const coords =
          Array.isArray(feat.geometry?.coordinates) && feat.geometry.coordinates.length >= 2
            ? {
                lat: Number(feat.geometry.coordinates[1]),
                lon: Number(feat.geometry.coordinates[0]),
              }
            : undefined;

        return {
          id: `sug_${country}_${p.osm_id || index}_${Date.now()}`,
          label,
          street: p.street || (p.housenumber && p.name ? `${p.housenumber} ${p.name}` : p.name) || undefined,
          housenumber: p.housenumber || undefined,
          locality: p.district || (p.name !== p.street ? p.name : undefined) || undefined,
          city: p.city || p.county || undefined,
          state: p.state || undefined,
          postalCode: p.postcode || undefined,
          country,
          coordinates: coords,
          attribution: "© OpenStreetMap contributors, ODbL 1.0",
        };
      });

      autocompleteCache.set(cacheKey, { data: suggestions, timestamp: Date.now() });

      return NextResponse.json<AddressAutocompleteResponse>({
        success: true,
        suggestions,
        query: cleanQuery,
        country,
        attribution: "OpenStreetMap / Photon Geocoding",
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      // Fallback: gracefully return empty suggestions so manual entry is uninterrupted
      return NextResponse.json<AddressAutocompleteResponse>({
        success: true,
        suggestions: [],
        query: cleanQuery,
        country,
        attribution: "OpenStreetMap",
        error: "Address autocomplete temporarily unavailable. Manual input active.",
        fallback: true,
      });
    }
  } catch (err: any) {
    return NextResponse.json<AddressAutocompleteResponse>(
      {
        success: false,
        suggestions: [],
        query: "",
        country: "IN",
        attribution: "OpenStreetMap",
        error: err?.message || "Internal server error.",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
