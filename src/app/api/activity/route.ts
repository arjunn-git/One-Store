import { NextResponse } from "next/server";
import { recordActivity } from "@/lib/services/activity";
import type { ActivityEventType } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, action, actor, market, currency, resourceType, resourceId, details } = body;

    if (!type || !action || !resourceType) {
      return NextResponse.json({ error: "Missing required activity parameters." }, { status: 400 });
    }

    // Capture IP address if available
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : undefined;

    const event = await recordActivity({
      type: type as ActivityEventType,
      action: String(action),
      actor: actor ? String(actor) : "Guest Shopper",
      market: market === "GB" ? "GB" : "IN",
      currency: currency === "GBP" ? "GBP" : "INR",
      resourceType: String(resourceType),
      resourceId: resourceId ? String(resourceId) : undefined,
      details: typeof details === "object" ? details : {},
      ipAddress,
    });

    return NextResponse.json({ success: true, event });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error recording telemetry event.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
