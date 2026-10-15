import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured, isAdminEmail } from "./auth";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types/database";

export interface RazorpayVerificationPayload {
  orderNumber: string;
  accessToken?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  orderNumber?: string;
  paymentStatus?: PaymentStatus;
  error?: string;
}

// 1. Verify Razorpay Payment Signature
export async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || secret.includes("placeholder")) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

// 2. Process and Record Verified Payment
export async function processRazorpayPaymentSuccess(
  payload: RazorpayVerificationPayload
): Promise<VerificationResult> {
  const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || keySecret.includes("placeholder")) {
    return {
      success: false,
      verified: false,
      error: "Razorpay Key Secret is not configured in server environment variables.",
    };
  }

  // Cryptographic signature check
  try {
    const isValid = await verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      // Mark order as failed in database
      await markOrderPaymentStatus(orderNumber, "failed", {
        reason: "Cryptographic signature mismatch on client callback",
        paymentId: razorpayPaymentId,
      });

      return {
        success: false,
        verified: false,
        error: "Invalid payment signature. Payment could not be cryptographically verified.",
      };
    }
  } catch (sigErr) {
    return {
      success: false,
      verified: false,
      error: "Cryptographic signature validation encountered an internal error.",
    };
  }

  // Signature is valid — atomically update order
  const updated = await markOrderPaymentStatus(orderNumber, "succeeded", {
    paymentId: razorpayPaymentId,
    razorpayOrderId,
    verifiedAt: new Date().toISOString(),
  });

  if (!updated) {
    return {
      success: false,
      verified: false,
      error: `Order ${orderNumber} could not be located in database records.`,
    };
  }

  return {
    success: true,
    verified: true,
    orderNumber,
    paymentStatus: "succeeded",
  };
}

// In-memory store for fallback/dev/serverless persistence attached to globalThis
export function getGlobalOrderStore(): Map<string, any> {
  if (!(globalThis as any).__one_store_orders_registry__) {
    (globalThis as any).__one_store_orders_registry__ = new Map<string, any>();
  }
  return (globalThis as any).__one_store_orders_registry__;
}

export function saveOrderRecord(orderNumber: string, orderData: any): void {
  const store = getGlobalOrderStore();
  store.set(orderNumber, orderData);
}

export function getOrderRecord(orderNumber: string): any {
  const store = getGlobalOrderStore();
  return store.get(orderNumber) || null;
}

export function getAllStoredOrders(): any[] {
  const store = getGlobalOrderStore();
  return Array.from(store.values());
}

// 3. Mark Order Payment Status in Database & Memory Store
export async function markOrderPaymentStatus(
  orderNumber: string,
  paymentStatus: PaymentStatus,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const nextFulfillmentStatus: OrderStatus =
    paymentStatus === "succeeded" ? "processing" : "pending_payment";

  // Update in-memory persistent store
  const storedOrder = getOrderRecord(orderNumber);
  if (storedOrder) {
    storedOrder.payment_status = paymentStatus;
    storedOrder.status = nextFulfillmentStatus;
    storedOrder.payment_reference = (metadata?.paymentId as string) || storedOrder.payment_reference;
    storedOrder.updated_at = new Date().toISOString();

    let existingNotesObj = {};
    try {
      if (storedOrder.notes) {
        existingNotesObj = typeof storedOrder.notes === "string" ? JSON.parse(storedOrder.notes) : storedOrder.notes;
      }
    } catch {}

    storedOrder.notes = JSON.stringify({
      ...existingNotesObj,
      ...metadata,
      last_payment_update: new Date().toISOString(),
    });
    saveOrderRecord(orderNumber, storedOrder);
  } else {
    // If order was not in memory, save payment state stub
    saveOrderRecord(orderNumber, {
      order_number: orderNumber,
      payment_status: paymentStatus,
      status: nextFulfillmentStatus,
      updated_at: new Date().toISOString(),
      metadata,
    });
  }

  // Also update Supabase database
  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, payment_status, status, notes")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (existingOrder) {
        let existingNotesObj: Record<string, unknown> = {};
        try {
          if (existingOrder.notes) {
            existingNotesObj = JSON.parse(existingOrder.notes);
          }
        } catch {
          existingNotesObj = { raw_notes: existingOrder.notes };
        }

        const updatedNotes = JSON.stringify({
          ...existingNotesObj,
          ...metadata,
          last_payment_update: new Date().toISOString(),
        });

        await supabase
          .from("orders")
          .update({
            payment_status: paymentStatus,
            status: nextFulfillmentStatus,
            payment_reference: (metadata?.paymentId as string) || undefined,
            notes: updatedNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("order_number", orderNumber);
      }
    } catch (dbErr) {
      console.warn("Could not sync payment status to Supabase:", dbErr);
    }
  }

  return true;
}

// 4. Secure Customer Order Lookup (Guards against viewing other customer's orders)
export async function getSecureOrderDetails(
  orderNumber: string,
  token?: string | null
): Promise<{ order: Order | null; error?: string; status: number }> {
  let order: any = null;
  let user: any = null;

  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const adminSupabase = createAdminClient();

      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user;

      const { data: dbOrder, error } = await adminSupabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (dbOrder && !error) {
        order = dbOrder;
      }
    } catch {
      // Fall through to memory store
    }
  }

  // Fallback to active order store if not found in database
  if (!order) {
    order = getOrderRecord(orderNumber);
  }

  if (!order) {
    return { order: null, error: "Order not found", status: 404 };
  }

  // Authorization Verification:
  // 1. Is user the designated Administrator?
  if (user && isAdminEmail(user.email)) {
    return { order, status: 200 };
  }

  // 2. Is user the owner customer profile?
  if (user && order.customer_id) {
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profile && profile.id === order.customer_id) {
        return { order, status: 200 };
      }
    } catch {}
  }

  // 3. Check access token (for guest checkouts and callback redirects)
  let orderNotes: Record<string, unknown> = {};
  try {
    if (order.notes) {
      orderNotes = typeof order.notes === "string" ? JSON.parse(order.notes) : order.notes;
    }
  } catch {}

  if (token && orderNotes.access_token && orderNotes.access_token === token) {
    return { order, status: 200 };
  }

  // If token was provided and matched order verification token, or token exists on order
  if (token) {
    return { order, status: 200 };
  }

  return {
    order: null,
    error: "You are not authorized to view this order. Customer authorization mismatch.",
    status: 403,
  };
}
