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

// In-memory store for fallback/dev environments attached to globalThis
const FALLBACK_ORDER_STORE: Map<string, { payment_status: PaymentStatus; status: OrderStatus; metadata?: any }> =
  (globalThis as any).__one_store_fallback_orders__ ||
  ((globalThis as any).__one_store_fallback_orders__ = new Map());

// 3. Mark Order Payment Status in Database
export async function markOrderPaymentStatus(
  orderNumber: string,
  paymentStatus: PaymentStatus,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const nextFulfillmentStatus: OrderStatus =
    paymentStatus === "succeeded" ? "processing" : "pending_payment";

  // Always record in local store for dev sandbox consistency
  FALLBACK_ORDER_STORE.set(orderNumber, {
    payment_status: paymentStatus,
    status: nextFulfillmentStatus,
    metadata,
  });

  if (!isLiveSupabaseConfigured()) {
    return true;
  }

  try {
    const supabase = createAdminClient();

    // Check if order exists and if already succeeded (idempotency)
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, payment_status, status, notes")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!existingOrder) {
      return false;
    }

    if (existingOrder.payment_status === "succeeded" && paymentStatus === "succeeded") {
      // Already processed idempotently
      return true;
    }

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

    const nextFulfillmentStatus: OrderStatus =
      paymentStatus === "succeeded" ? "processing" : "pending_payment";

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: nextFulfillmentStatus,
        payment_reference: (metadata?.paymentId as string) || undefined,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", orderNumber);

    return !error;
  } catch (err) {
    console.error("Error marking order payment status:", err);
    return false;
  }
}

// 4. Secure Customer Order Lookup (Guards against viewing other customer's orders)
export async function getSecureOrderDetails(
  orderNumber: string,
  token?: string | null
): Promise<{ order: Order | null; error?: string; status: number }> {
  if (!isLiveSupabaseConfigured()) {
    const stored = FALLBACK_ORDER_STORE.get(orderNumber);
    // Development fallback mock order
    return {
      order: {
        id: "ord_dev_sample",
        order_number: orderNumber,
        customer_id: "cust_sample",
        status: stored?.status || "pending_payment",
        payment_status: stored?.payment_status || "pending",
        currency: "INR",
        subtotal: 24999,
        discount_amount: 0,
        shipping_fee: 0,
        tax_amount: 0,
        total_amount: 24999,
        shipping_address: {
          id: "addr_1",
          customer_id: "cust_sample",
          recipient_name: "Customer",
          phone: "+91 98765 43210",
          line1: "123 Bandra Kurla Complex",
          city: "Mumbai",
          state_or_province: "Maharashtra",
          postal_code: "400051",
          country_code: "IN",
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        payment_provider: "razorpay",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      status: 200,
    };
  }

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check currently authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch order from database using admin client to read metadata
    const { data: order, error } = await adminSupabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !order) {
      return { order: null, error: "Order not found", status: 404 };
    }

    // Authorization Verification:
    // 1. Is user the designated Administrator?
    if (user && isAdminEmail(user.email)) {
      return { order, status: 200 };
    }

    // 2. Is user the owner customer profile?
    if (user && order.customer_id) {
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profile && profile.id === order.customer_id) {
        return { order, status: 200 };
      }
    }

    // 3. For guest checkout or tokenized access: check access token
    let orderNotes: Record<string, unknown> = {};
    try {
      if (order.notes) {
        orderNotes = JSON.parse(order.notes);
      }
    } catch {
      // Ignored
    }

    if (token && orderNotes.access_token && orderNotes.access_token === token) {
      return { order, status: 200 };
    }

    // Unauthorized access attempt
    return {
      order: null,
      error: "You are not authorized to view this order. Customer authorization mismatch.",
      status: 403,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching order";
    return { order: null, error: msg, status: 500 };
  }
}
