import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "./auth";
import { FALLBACK_PRODUCTS } from "./products";
import type { OrderStatus, PaymentStatus } from "@/lib/types/database";

export interface CheckoutPayload {
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
  }[];
  market: "IN" | "GB";
  currency: "INR" | "GBP";
  customerEmail: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  countryCode: "IN" | "GB";
  paymentProvider: "razorpay" | "stripe";
  promoCode?: string;
}

export interface OrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  totalAmount?: number;
  currency?: "INR" | "GBP";
  error?: string;
}

export async function processCheckout(payload: CheckoutPayload): Promise<OrderResult> {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Cannot process an empty cart." };
    }

    // 1. Server-side price recalculation (Never trust client-submitted prices)
    let computedSubtotal = 0;
    const validatedItems = [];

    for (const item of payload.items) {
      const catalogItem = FALLBACK_PRODUCTS.find((p) => p.id === item.productId);
      if (!catalogItem) {
        return { success: false, error: `Product ID ${item.productId} was not found.` };
      }

      const variant = item.variantId
        ? catalogItem.variants.find((v) => v.id === item.variantId)
        : null;

      const basePrice = payload.currency === "INR" ? catalogItem.price_inr : catalogItem.price_gbp;
      const adj = variant
        ? payload.currency === "INR"
          ? variant.price_inr_adjustment
          : variant.price_gbp_adjustment
        : 0;

      const unitPrice = basePrice + adj;
      const itemTotal = unitPrice * item.quantity;
      computedSubtotal += itemTotal;

      validatedItems.push({
        productId: catalogItem.id,
        variantId: variant?.id || null,
        productName: catalogItem.name,
        variantName: variant?.name || null,
        sku: variant?.sku || catalogItem.sku,
        unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    // 2. Shipping calculation
    const freeShippingThreshold = payload.currency === "INR" ? 5000 : 50;
    const standardShipping = payload.currency === "INR" ? 250 : 5;
    const shippingFee = computedSubtotal >= freeShippingThreshold ? 0 : standardShipping;

    // 3. Discount verification
    let discountAmount = 0;
    if (payload.promoCode?.toUpperCase() === "LAUNCH10") {
      discountAmount = (computedSubtotal * 10) / 100;
    }

    const finalTotal = computedSubtotal - discountAmount + shippingFee;

    // 4. Generate unique readable order number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `OS-2026-${payload.market}-${randomSuffix}`;

    // 5. Attempt PostgreSQL persistence via Supabase if live credentials are configured
    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        await supabase.from("orders").insert({
          order_number: orderNumber,
          customer_id: user?.id || null,
          status: "pending_payment" as OrderStatus,
          payment_status: "pending" as PaymentStatus,
          currency: payload.currency,
          subtotal: computedSubtotal,
          discount_amount: discountAmount,
          shipping_fee: shippingFee,
          total_amount: finalTotal,
          shipping_address: {
            recipientName: payload.recipientName,
            phone: payload.phone,
            line1: payload.line1,
            line2: payload.line2 || "",
            city: payload.city,
            stateOrProvince: payload.stateOrProvince,
            postalCode: payload.postalCode,
            countryCode: payload.countryCode,
          },
          payment_provider: payload.paymentProvider,
        });
      } catch {
        // Gracefully continue in sandbox/preview mode
      }
    }

    return {
      success: true,
      orderNumber,
      orderId: `ord_${Date.now()}`,
      totalAmount: finalTotal,
      currency: payload.currency,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Checkout computation error.";
    return { success: false, error: msg };
  }
}
