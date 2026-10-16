import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { getRecentActivities } from "@/lib/services/activity";

export async function GET(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 50;
    const since = searchParams.get("since") || undefined;
    const type = searchParams.get("type") || undefined;
    const market = (searchParams.get("market") as "IN" | "GB") || undefined;

    const activities = await getRecentActivities({
      limit,
      since,
      type,
      market,
    });

    // Compute live operational telemetry
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentUniqueActors = new Set(
      activities
        .filter((a) => new Date(a.timestamp).getTime() > fifteenMinutesAgo)
        .map((a) => a.actor)
    );

    const counts = {
      total: activities.length,
      orders: activities.filter((a) => a.type === "ORDER_CREATED").length,
      payments: activities.filter((a) => a.type === "PAYMENT_SUCCESS").length,
      cart: activities.filter((a) => a.type === "CART_ADD" || a.type === "CART_REMOVE").length,
      marketSwitches: activities.filter((a) => a.type === "MARKET_SWITCH").length,
      auth: activities.filter((a) => a.type === "CUSTOMER_LOGIN" || a.type === "CUSTOMER_SIGNUP").length,
    };

    return NextResponse.json({
      success: true,
      activities,
      counts,
      activeShoppersCount: Math.max(1, recentUniqueActors.size),
      serverTime: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error querying activity telemetry.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
