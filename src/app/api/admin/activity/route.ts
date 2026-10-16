import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { getRecentActivities, getActiveShoppersCount } from "@/lib/services/activity";

export async function GET(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const since = searchParams.get("since") || undefined;
    const type = searchParams.get("type") || undefined;
    const market = (searchParams.get("market") as "IN" | "GB") || undefined;

    const [activities, activeShoppersCount] = await Promise.all([
      getRecentActivities({
        limit,
        since,
        type,
        market,
      }),
      getActiveShoppersCount(),
    ]);

    const counts = {
      total: activities.length,
      orders: activities.filter((a) =>
        [
          "ORDER_CREATED",
          "ORDER_STATUS_CHANGED",
          "ORDER_FULFILLED",
          "ORDER_CANCELLED",
          "ORDER_REFUNDED",
        ].includes(a.type)
      ).length,
      payments: activities.filter((a) =>
        ["PAYMENT_SUCCESS", "PAYMENT_FAILED", "PAYMENT_PENDING", "PAYMENT_REFUNDED"].includes(a.type)
      ).length,
      cart: activities.filter((a) =>
        ["CART_ADD", "CART_REMOVE", "CART_UPDATED", "CART_CLEARED"].includes(a.type)
      ).length,
      marketSwitches: activities.filter((a) => a.type === "MARKET_SWITCH").length,
      auth: activities.filter((a) =>
        ["CUSTOMER_LOGIN", "CUSTOMER_SIGNUP", "CUSTOMER_LOGOUT"].includes(a.type)
      ).length,
      support: activities.filter((a) => a.type === "SUPPORT_INQUIRY").length,
      product: activities.filter((a) => a.type === "PRODUCT_VIEW" || a.type === "SEARCH_QUERY").length,
    };

    return NextResponse.json({
      success: true,
      activities,
      counts,
      activeShoppersCount, // Real calculated active sessions (0 when none online)
      serverTime: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error querying activity telemetry.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
