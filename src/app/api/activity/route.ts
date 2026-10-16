import { NextResponse } from "next/server";
import { recordActivity, recordSessionHeartbeat } from "@/lib/services/activity";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import type { ActivityEventType } from "@/lib/types/database";

// Only non-privileged storefront events may be emitted from browser clients.
// Financial, administrative, order lifecycle, and authentication events MUST originate server-side.
const ALLOWED_CLIENT_EVENT_TYPES = new Set<ActivityEventType>([
  "CART_ADD",
  "CART_REMOVE",
  "CART_UPDATED",
  "CART_CLEARED",
  "CHECKOUT_INITIATED",
  "MARKET_SWITCH",
  "PRODUCT_VIEW",
  "SEARCH_QUERY",
  "SESSION_ACTIVE",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      action,
      actor,
      market,
      currency,
      resourceType,
      resourceId,
      details,
      anonymousSessionId,
    } = body;

    // Security check: Guard against client-side spoofing of trusted order/payment/auth events
    if (!type || !ALLOWED_CLIENT_EVENT_TYPES.has(type as ActivityEventType)) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Privileged events (Orders, Payments, Auth) cannot be submitted via client API.",
        },
        { status: 403 }
      );
    }

    const sessionId =
      request.headers.get("x-session-id") ||
      (typeof anonymousSessionId === "string" ? anonymousSessionId.trim() : undefined);

    const safeMarket = market === "GB" ? "GB" : "IN";

    // 1. Resolve Genuine Customer Identity (Real Full Name & Email)
    let resolvedActor = actor && typeof actor === "string" && actor.trim() !== "Guest Shopper"
      ? actor.trim()
      : "";
    let authUserId: string | undefined = undefined;

    // Check Supabase Auth for authenticated customer
    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          authUserId = authData.user.id;
          const userEmail = authData.user.email?.toLowerCase().trim();

          const { data: profile } = await supabase
            .from("customer_profiles")
            .select("full_name")
            .eq("auth_user_id", authData.user.id)
            .maybeSingle();

          const realName =
            profile?.full_name?.trim() ||
            authData.user.user_metadata?.full_name?.trim() ||
            (userEmail ? userEmail.split("@")[0] : "");

          if (realName && userEmail) {
            resolvedActor = `${realName} (${userEmail})`;
          } else if (userEmail) {
            resolvedActor = `${userEmail.split("@")[0]} (${userEmail})`;
          }
        }
      } catch {
        // Fallback to cookie detection
      }
    }

    // Check request cookies if Supabase user was not resolved
    if (!resolvedActor) {
      const cookieHeader = request.headers.get("cookie") || "";
      const nameMatch = cookieHeader.match(/one_store_user_name=([^;]+)/);
      const emailMatch = cookieHeader.match(/one_store_user_email=([^;]+)/);
      const cookieName = nameMatch ? decodeURIComponent(nameMatch[1]).trim() : "";
      const cookieEmail = emailMatch ? decodeURIComponent(emailMatch[1]).trim() : "";

      if (cookieName && cookieEmail) {
        resolvedActor = `${cookieName} (${cookieEmail})`;
      } else if (cookieName) {
        resolvedActor = `${cookieName} (Customer)`;
      } else if (cookieEmail) {
        resolvedActor = `${cookieEmail.split("@")[0]} (${cookieEmail})`;
      } else {
        const shortId = (sessionId || "").slice(-5);
        const marketLabel = safeMarket === "GB" ? "UK" : "India";
        resolvedActor = shortId ? `${marketLabel} Shopper (#${shortId})` : `${marketLabel} Shopper`;
      }
    }

    // Handle lightweight active visitor session heartbeat
    if (type === "SESSION_ACTIVE") {
      if (sessionId) {
        await recordSessionHeartbeat({
          sessionId,
          market: safeMarket,
          authUserId,
        });
      }
      return NextResponse.json({ success: true, sessionActive: true, actor: resolvedActor });
    }

    if (!action || !resourceType) {
      return NextResponse.json({ error: "Missing required activity parameters." }, { status: 400 });
    }

    // Capture IP address if available
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

    // Strip sensitive fields from client details
    const sanitizedDetails: Record<string, unknown> = {};
    if (details && typeof details === "object" && !Array.isArray(details)) {
      const sensitiveKeys = new Set(["password", "token", "secret", "cvv", "card_number", "apiKey"]);
      for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
        if (!sensitiveKeys.has(k.toLowerCase())) {
          sanitizedDetails[k] = typeof v === "string" ? v.slice(0, 500) : v;
        }
      }
    }

    const event = await recordActivity({
      type: type as ActivityEventType,
      action: String(action).slice(0, 200),
      actor: resolvedActor.slice(0, 100),
      authUserId,
      anonymousSessionId: sessionId,
      market: safeMarket,
      currency: currency === "GBP" ? "GBP" : "INR",
      resourceType: String(resourceType).slice(0, 100),
      resourceId: resourceId ? String(resourceId).slice(0, 100) : undefined,
      details: sanitizedDetails,
      ipAddress,
    });

    return NextResponse.json({ success: true, event });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error recording telemetry event.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
