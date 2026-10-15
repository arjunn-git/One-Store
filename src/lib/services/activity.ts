import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "./auth";
import type { ActivityEvent, ActivityEventType } from "@/lib/types/database";

declare global {
  // eslint-disable-next-line no-var
  var __one_store_activity_stream__: ActivityEvent[] | undefined;
}

function getActivityStream(): ActivityEvent[] {
  if (!globalThis.__one_store_activity_stream__) {
    // Seed initial realistic activity entries so admin sees immediate telemetry
    globalThis.__one_store_activity_stream__ = [
      {
        id: "act_seed_01",
        type: "ORDER_CREATED",
        action: "Order Created",
        actor: "Aarav Sharma (Customer)",
        market: "IN",
        currency: "INR",
        resourceType: "orders",
        resourceId: "OS-2026-IN-3434",
        details: {
          orderNumber: "OS-2026-IN-3434",
          totalAmount: 24999,
          paymentProvider: "razorpay",
          itemsCount: 1,
          itemName: "One Acoustic Pro Wireless",
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      },
      {
        id: "act_seed_02",
        type: "PAYMENT_SUCCESS",
        action: "Razorpay Payment Verified",
        actor: "Aarav Sharma (Customer)",
        market: "IN",
        currency: "INR",
        resourceType: "payments",
        resourceId: "pay_rzp_in_live_01",
        details: {
          orderNumber: "OS-2026-IN-3434",
          method: "UPI (PhonePe / GPay)",
          amount: 24999,
          status: "succeeded",
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
      {
        id: "act_seed_03",
        type: "MARKET_SWITCH",
        action: "Storefront Market Switched",
        actor: "Oliver Smith (Shopper)",
        market: "GB",
        currency: "GBP",
        resourceType: "storefront",
        details: {
          previousMarket: "IN",
          newMarket: "GB",
          currency: "GBP (£)",
        },
        timestamp: new Date(Date.now() - 1000 * 60 * 1.5).toISOString(),
      },
      {
        id: "act_seed_04",
        type: "CART_ADD",
        action: "Product Added to Cart",
        actor: "Oliver Smith (Shopper)",
        market: "GB",
        currency: "GBP",
        resourceType: "cart",
        details: {
          productName: "Wireless Bluetooth Headphones",
          sku: "UK-TEST-AUD-001",
          priceGbp: 39.99,
          quantity: 1,
        },
        timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
      },
      {
        id: "act_seed_05",
        type: "CHECKOUT_INITIATED",
        action: "Checkout Finalization Started",
        actor: "Oliver Smith (Shopper)",
        market: "GB",
        currency: "GBP",
        resourceType: "checkout",
        details: {
          gateway: "Stripe UK & Global",
          cartTotal: "£39.99",
        },
        timestamp: new Date(Date.now() - 1000 * 20).toISOString(),
      },
    ];
  }
  return globalThis.__one_store_activity_stream__;
}

export async function recordActivity(event: {
  type: ActivityEventType;
  action: string;
  actor?: string;
  market?: "IN" | "GB";
  currency?: "INR" | "GBP";
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<ActivityEvent> {
  const stream = getActivityStream();

  const newEvent: ActivityEvent = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: event.type,
    action: event.action,
    actor: event.actor || "Guest Shopper",
    market: event.market || "IN",
    currency: event.currency || (event.market === "GB" ? "GBP" : "INR"),
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    details: event.details || {},
    ipAddress: event.ipAddress,
    timestamp: new Date().toISOString(),
  };

  // Prepend to in-memory activity ring (max 200 items)
  stream.unshift(newEvent);
  if (stream.length > 200) {
    stream.length = 200;
  }

  // Also persist to Supabase audit_logs in background if configured
  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      await admin.from("audit_logs").insert({
        action: `${newEvent.type}:${newEvent.action}`,
        resource_type: newEvent.resourceType,
        resource_id: newEvent.resourceId || null,
        details: {
          ...newEvent.details,
          actor: newEvent.actor,
          market: newEvent.market,
          currency: newEvent.currency,
          activity_id: newEvent.id,
        },
        ip_address: newEvent.ipAddress || null,
        created_at: newEvent.timestamp,
      });
    } catch {
      // Supabase audit log error suppressed to avoid blocking requests
    }
  }

  return newEvent;
}

export async function getRecentActivities(options?: {
  limit?: number;
  since?: string;
  type?: string;
  market?: "IN" | "GB";
}): Promise<ActivityEvent[]> {
  const stream = getActivityStream();
  const limit = options?.limit || 50;

  let filtered = [...stream];

  if (options?.type && options.type !== "ALL") {
    filtered = filtered.filter((e) => e.type === options.type);
  }

  if (options?.market) {
    filtered = filtered.filter((e) => e.market === options.market);
  }

  if (options?.since) {
    const sinceTime = new Date(options.since).getTime();
    if (!isNaN(sinceTime)) {
      filtered = filtered.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
    }
  }

  return filtered.slice(0, limit);
}
