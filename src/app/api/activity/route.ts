import { NextResponse } from "next/server";
import { recordActivity, recordSessionHeartbeat } from "@/lib/services/activity";
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

    // Handle lightweight active visitor session heartbeat
    if (type === "SESSION_ACTIVE") {
      if (sessionId) {
        await recordSessionHeartbeat({
          sessionId,
          market: safeMarket,
        });
      }
      return NextResponse.json({ success: true, sessionActive: true });
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
      actor: actor ? String(actor).slice(0, 100) : "Guest Shopper",
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
