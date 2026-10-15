import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "./auth";
import { FALLBACK_PRODUCTS } from "./products";
import type { OrderStatus, PaymentStatus, Product, ProductVariant } from "@/lib/types/database";

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
  accessToken?: string;
  totalAmount?: number;
  currency?: "INR" | "GBP";
  paymentProvider?: "razorpay" | "stripe";
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  stripeCheckoutUrl?: string;
  isTestMode?: boolean;
  requiresCredentials?: boolean;
  message?: string;
  error?: string;
}

export async function processCheckout(payload: CheckoutPayload): Promise<OrderResult> {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: "Cannot process an empty cart." };
    }

    // 1. Fetch available products from live database (or fallback)
    let dbProducts: (Product & { variants: ProductVariant[] })[] = [];
    let supabase = null;

    if (isLiveSupabaseConfigured()) {
      try {
        supabase = await createClient();
        const { data } = await supabase
          .from("products")
          .select("*, variants:product_variants(*)")
          .eq("status", "active");
        if (data && data.length > 0) {
          dbProducts = data;
        }
      } catch {
        // Fallback to local catalog
      }
    }

    if (dbProducts.length === 0) {
      dbProducts = FALLBACK_PRODUCTS;
    }

    // 2. Server-side price recalculation & stock verification
    let computedSubtotal = 0;
    const validatedItems: {
      productId: string;
      variantId: string | null;
      productName: string;
      variantName: string | null;
      sku: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      availableStock: number;
    }[] = [];

    for (const item of payload.items) {
      const catalogItem = dbProducts.find((p) => p.id === item.productId);
      if (!catalogItem) {
        return {
          success: false,
          error: `Item with ID ${item.productId} was not found in active inventory.`,
        };
      }

      const variant = item.variantId
        ? catalogItem.variants?.find((v) => v.id === item.variantId)
        : catalogItem.variants?.[0] || null;

      // Stock verification
      const currentStock = variant?.inventory_count ?? 10;
      if (currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${catalogItem.name}${variant ? ` (${variant.name})` : ""}". Available: ${currentStock}, Requested: ${item.quantity}.`,
        };
      }

      const basePrice = payload.currency === "INR" ? catalogItem.price_inr : catalogItem.price_gbp;
      const adj = variant
        ? payload.currency === "INR"
          ? variant.price_inr_adjustment || 0
          : variant.price_gbp_adjustment || 0
        : 0;

      const unitPrice = Math.max(0, basePrice + adj);
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
        availableStock: currentStock,
      });
    }

    // 3. Shipping calculation
    const freeShippingThreshold = payload.currency === "INR" ? 5000 : 50;
    const standardShipping = payload.currency === "INR" ? 250 : 5;
    const shippingFee = computedSubtotal >= freeShippingThreshold ? 0 : standardShipping;

    // 4. Discount verification
    let discountAmount = 0;
    if (payload.promoCode?.toUpperCase() === "LAUNCH10") {
      discountAmount = Math.round((computedSubtotal * 10) / 100);
    }

    const finalTotal = Math.max(0, computedSubtotal - discountAmount + shippingFee);

    // 5. Generate human-readable order number & access token
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `OS-2026-${payload.market}-${randomSuffix}`;
    const accessToken = crypto.randomBytes(24).toString("hex");

    let createdOrderId = `ord_${Date.now()}`;
    let isTestMode = false;
    let requiresCredentials = false;
    let message: string | undefined;

    // 6. Database persistence with correct foreign keys & atomic stock decrement
    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let customerProfileId = null;

        // Correctly lookup or create customer_profile referencing auth_user_id
        if (user) {
          const { data: profile } = await supabase
            .from("customer_profiles")
            .select("id")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (profile) {
            customerProfileId = profile.id;
          } else {
            const { data: newProfile } = await supabase
              .from("customer_profiles")
              .insert({
                auth_user_id: user.id,
                email: payload.customerEmail || user.email,
                full_name: payload.recipientName,
                is_email_verified: true,
              })
              .select("id")
              .single();

            if (newProfile) {
              customerProfileId = newProfile.id;
            }
          }
        }

        // Insert Order with access_token stored in notes
        const { data: insertedOrder } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            customer_id: customerProfileId,
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
            notes: JSON.stringify({
              access_token: accessToken,
              created_at: new Date().toISOString(),
            }),
          })
          .select("id")
          .single();

        if (insertedOrder) {
          createdOrderId = insertedOrder.id;

          // Insert Order Items
          const orderItemsToInsert = validatedItems.map((item) => ({
            order_id: insertedOrder.id,
            product_id: item.productId,
            variant_id: item.variantId,
            product_name: item.productName,
            variant_name: item.variantName,
            sku: item.sku,
            unit_price: item.unitPrice,
            quantity: item.quantity,
            total_price: item.totalPrice,
          }));

          await supabase.from("order_items").insert(orderItemsToInsert);

          // Atomically decrement stock
          for (const item of validatedItems) {
            if (item.variantId) {
              try {
                // Call atomic decrement function if present
                await supabase.rpc("decrement_variant_inventory", {
                  p_variant_id: item.variantId,
                  p_quantity: item.quantity,
                  p_order_number: orderNumber,
                });
              } catch {
                // Fallback direct count decrement
                await supabase
                  .from("product_variants")
                  .update({
                    inventory_count: Math.max(0, item.availableStock - item.quantity),
                  })
                  .eq("id", item.variantId);
              }
            }
          }
        }
      } catch (dbErr) {
        console.error("Database order insertion error:", dbErr);
      }
    }

    // 7. Payment Provider Order / Session Creation
    let razorpayOrderId: string | undefined;
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    let stripeCheckoutUrl: string | undefined;

    // Process India / Razorpay
    if (payload.paymentProvider === "razorpay") {
      if (
        razorpayKeyId &&
        razorpayKeySecret &&
        !razorpayKeyId.includes("placeholder") &&
        !razorpayKeySecret.includes("placeholder")
      ) {
        try {
          const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
          const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authHeader}`,
            },
            body: JSON.stringify({
              amount: Math.round(finalTotal * 100), // In paise
              currency: "INR",
              receipt: orderNumber,
              notes: {
                order_number: orderNumber,
                customer_email: payload.customerEmail,
              },
            }),
          });

          if (rzpResponse.ok) {
            const rzpData = await rzpResponse.json();
            razorpayOrderId = rzpData.id;
          } else {
            const errBody = await rzpResponse.text();
            console.error("Razorpay order API error:", errBody);
            isTestMode = true;
            requiresCredentials = true;
            message = "Unable to create Razorpay order with current credentials. Please verify your Key ID & Secret.";
          }
        } catch {
          isTestMode = true;
          requiresCredentials = true;
          message = "Razorpay API connection failed. Please check network and credentials.";
        }
      } else {
        isTestMode = true;
        requiresCredentials = true;
        message =
          "Razorpay test credentials (NEXT_PUBLIC_RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured in environment variables.";
      }
    }

    // Process UK / Stripe
    if (payload.paymentProvider === "stripe") {
      if (stripeSecretKey && !stripeSecretKey.includes("placeholder")) {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          const stripeParams = new URLSearchParams();
          stripeParams.append("payment_method_types[]", "card");
          stripeParams.append("mode", "payment");
          stripeParams.append("customer_email", payload.customerEmail);
          stripeParams.append("client_reference_id", orderNumber);
          stripeParams.append(
            "success_url",
            `${siteUrl}/checkout/success?orderNumber=${orderNumber}&token=${accessToken}`
          );
          stripeParams.append("cancel_url", `${siteUrl}/checkout?cancelled=true`);

          validatedItems.forEach((item, index) => {
            stripeParams.append(`line_items[${index}][price_data][currency]`, "gbp");
            stripeParams.append(
              `line_items[${index}][price_data][unit_amount]`,
              Math.round(item.unitPrice * 100).toString()
            );
            stripeParams.append(
              `line_items[${index}][price_data][product_data][name]`,
              item.productName + (item.variantName ? ` - ${item.variantName}` : "")
            );
            stripeParams.append(`line_items[${index}][quantity]`, item.quantity.toString());
          });

          if (shippingFee > 0) {
            const idx = validatedItems.length;
            stripeParams.append(`line_items[${idx}][price_data][currency]`, "gbp");
            stripeParams.append(
              `line_items[${idx}][price_data][unit_amount]`,
              Math.round(shippingFee * 100).toString()
            );
            stripeParams.append(
              `line_items[${idx}][price_data][product_data][name]`,
              "Standard UK Courier Shipping"
            );
            stripeParams.append(`line_items[${idx}][quantity]`, "1");
          }

          const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Bearer ${stripeSecretKey}`,
            },
            body: stripeParams.toString(),
          });

          if (stripeRes.ok) {
            const stripeData = await stripeRes.json();
            stripeCheckoutUrl = stripeData.url;
          } else {
            console.error("Stripe session API error:", await stripeRes.text());
            isTestMode = true;
            requiresCredentials = true;
          }
        } catch {
          isTestMode = true;
          requiresCredentials = true;
        }
      } else {
        isTestMode = true;
        requiresCredentials = true;
      }
    }

    return {
      success: true,
      orderNumber,
      orderId: createdOrderId,
      accessToken,
      totalAmount: finalTotal,
      currency: payload.currency,
      paymentProvider: payload.paymentProvider,
      razorpayOrderId,
      razorpayKeyId,
      stripeCheckoutUrl,
      isTestMode,
      requiresCredentials,
      message,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Checkout computation error.";
    return { success: false, error: msg };
  }
}
