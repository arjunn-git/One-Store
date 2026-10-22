import { NextResponse } from "next/server";
import { processCheckout, type CheckoutPayload } from "@/lib/services/checkout";
import { recordActivity } from "@/lib/services/activity";
import { notifyAdminOrderPlaced } from "@/lib/services/admin-notifications";
import {
  resolveServerSession,
  getOrCreateCustomerProfile,
  getCustomerAddresses,
} from "@/lib/services/server-auth";
import {
  calculateProfileCompletion,
  validatePostalCode,
  validatePhoneNumber,
} from "@/lib/services/profile-validation";

export async function POST(request: Request) {
  try {
    const body: CheckoutPayload = await request.json();

    const session = await resolveServerSession();

    // 1. Mandatory Authentication Check
    if (!session) {
      return NextResponse.json(
        {
          error: "Authentication required. Please sign in or register before checking out.",
          requireLogin: true,
        },
        { status: 401 }
      );
    }

    const authUser = {
      id: session.authUserId || undefined,
      email: session.email,
    };

    // 2. Fetch Customer Profile & Addresses
    const customerProfile = await getOrCreateCustomerProfile(session);
    const addresses = await getCustomerAddresses(customerProfile.id);

    // 3. Email Verification Requirement
    const isEmailVerified = session.isEmailVerified || !!customerProfile.is_email_verified;
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
    const effectiveProfile = {
      ...customerProfile,
      email: session.email,
      is_email_verified: isEmailVerified,
    };

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
