import { NextResponse } from "next/server";
import { processCheckout, type CheckoutPayload } from "@/lib/services/checkout";
import { recordActivity } from "@/lib/services/activity";
import { notifyAdminOrderPlaced } from "@/lib/services/admin-notifications";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import {
  calculateProfileCompletion,
  validatePostalCode,
  validatePhoneNumber,
} from "@/lib/services/profile-validation";

export async function POST(request: Request) {
  try {
    const body: CheckoutPayload = await request.json();

    let authUser: any = null;
    let customerProfile: any = null;

    if (isLiveSupabaseConfigured()) {
      const supabase = await createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();

      // 1. Mandatory Authentication Check
      if (authError || !authData.user) {
        return NextResponse.json(
          {
            error: "Authentication required. Please sign in or register before checking out.",
            requireLogin: true,
          },
          { status: 401 }
        );
      }

      authUser = authData.user;

      // 2. Fetch Customer Profile & Addresses
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      customerProfile = profile;

      let addresses: any[] = [];
      if (profile?.id) {
        const { data: addrData } = await supabase
          .from("addresses")
          .select("*")
          .eq("customer_id", profile.id);
        addresses = addrData || [];
      }

      // 3. Email Verification Requirement
      const isEmailVerified = !!authUser.email_confirmed_at || profile?.is_email_verified;
      if (!isEmailVerified) {
        return NextResponse.json(
          {
            error: "Email verification required. Please verify your email before proceeding with checkout.",
            requireEmailVerification: true,
          },
          { status: 403 }
        );
      }

      // 4. Mandatory 100% Profile Completion Check
      const effectiveProfile = profile
        ? { ...profile, email: authUser.email, is_email_verified: isEmailVerified }
        : { auth_user_id: authUser.id, email: authUser.email, is_email_verified: isEmailVerified };

      const completion = calculateProfileCompletion(effectiveProfile, addresses);

      if (!completion.isComplete) {
        return NextResponse.json(
          {
            error: `Profile incomplete (${completion.percentage}% complete). 100% complete profile is mandatory before checkout. Missing: ${completion.missingFields.join(", ")}.`,
            profileIncomplete: true,
            percentage: completion.percentage,
            missingFields: completion.missingFields,
            fieldErrors: completion.fieldErrors,
          },
          { status: 403 }
        );
      }
    }

    // 5. Server-Side Address & Contact Validation
    const targetCountry: "IN" | "GB" = body.market === "GB" ? "GB" : "IN";
    if (!body.recipientName?.trim()) {
      return NextResponse.json({ error: "Recipient name is required." }, { status: 400 });
    }
    if (!body.line1?.trim()) {
      return NextResponse.json({ error: "Delivery street address is required." }, { status: 400 });
    }
    if (!body.city?.trim()) {
      return NextResponse.json({ error: "Delivery city is required." }, { status: 400 });
    }
    if (!validatePhoneNumber(body.phone, targetCountry)) {
      return NextResponse.json(
        {
          error:
            targetCountry === "IN"
              ? "Valid 10-digit Indian mobile number is required."
              : "Valid UK mobile number is required.",
        },
        { status: 400 }
      );
    }
    if (!validatePostalCode(body.postalCode, targetCountry)) {
      return NextResponse.json(
        {
          error:
            targetCountry === "IN"
              ? "Valid 6-digit Indian PIN code is required."
              : "Valid UK alphanumeric postcode is required.",
        },
        { status: 400 }
      );
    }

    // 6. Execute Order & Payment Session Processing
    const result = await processCheckout(body, authUser, customerProfile);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.orderNumber) {
      await recordActivity({
        type: "ORDER_CREATED",
        action: `Order Placed: ${result.orderNumber}`,
        actor: `${body.recipientName || "Customer"} (${body.customerEmail || authUser?.email || "Shopper"})`,
        market: body.market,
        currency: result.currency,
        resourceType: "orders",
        resourceId: result.orderNumber,
        details: {
          orderNumber: result.orderNumber,
          totalAmount: result.totalAmount,
          currency: result.currency,
          paymentProvider: result.paymentProvider,
          itemsCount: body.items?.length || 1,
          city: body.city,
          country: body.market === "GB" ? "United Kingdom" : "India",
        },
      });

      // Dispatch real-time email notification to onestore.auth@gmail.com
      notifyAdminOrderPlaced({
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount || 0,
        currency: result.currency || (body.market === "GB" ? "GBP" : "INR"),
        market: body.market,
        paymentProvider: result.paymentProvider || body.paymentProvider,
        customerName: body.recipientName || "Customer",
        customerEmail: body.customerEmail || authUser?.email || "",
        phone: body.phone,
        shippingAddress: {
          line1: body.line1,
          city: body.city,
          stateOrProvince: body.stateOrProvince,
          postalCode: body.postalCode,
          countryCode: body.countryCode,
        },
      }).catch((e) => console.error("Admin order notification error:", e));
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error during checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
