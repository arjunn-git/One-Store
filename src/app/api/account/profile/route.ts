import { NextResponse } from "next/server";
import {
  resolveServerSession,
  getOrCreateCustomerProfile,
  getCustomerAddresses,
  updateCustomerProfile,
  saveCustomerAddress,
} from "@/lib/services/server-auth";
import { calculateProfileCompletion, validatePhoneNumber, validatePostalCode } from "@/lib/services/profile-validation";

export async function GET() {
  try {
    const session = await resolveServerSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getOrCreateCustomerProfile(session);
    const addresses = await getCustomerAddresses(profile.id);

    const effectiveProfile = {
      ...profile,
      email: session.email,
      is_email_verified: profile.is_email_verified ?? true,
    };

    const completion = calculateProfileCompletion(effectiveProfile, addresses);

    return NextResponse.json({
      success: true,
      profile: effectiveProfile,
      addresses,
      completion,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await resolveServerSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name,
      phone,
      preferred_currency,
      country,
      apartment_unit,
      street_address,
      city,
      state_or_province,
      postal_code,
      delivery_instructions,
      marketing_consent,
    } = body;

    const targetCountry: "IN" | "GB" = country || (preferred_currency === "GBP" ? "GB" : "IN");

    // Optional format validation if values are provided
    if (phone && !validatePhoneNumber(phone, targetCountry)) {
      return NextResponse.json(
        {
          success: false,
          error:
            targetCountry === "IN"
              ? "Invalid Indian mobile number (e.g. +91 98765 43210)"
              : "Invalid UK mobile number (e.g. +44 7911 123456)",
        },
        { status: 400 }
      );
    }

    if (postal_code && !validatePostalCode(postal_code, targetCountry)) {
      return NextResponse.json(
        {
          success: false,
          error:
            targetCountry === "IN"
              ? "Invalid Indian PIN code (6 digits, e.g. 400001)"
              : "Invalid UK postcode (e.g. SW1A 1AA)",
        },
        { status: 400 }
      );
    }

    const profileUpdates = {
      full_name: full_name?.trim() || null,
      phone: phone?.trim() || null,
      country: targetCountry,
      preferred_currency: preferred_currency || (targetCountry === "GB" ? "GBP" : "INR"),
      apartment_unit: apartment_unit?.trim() || null,
      street_address: street_address?.trim() || null,
      city: city?.trim() || null,
      state_or_province: state_or_province?.trim() || null,
      postal_code: postal_code?.trim()?.toUpperCase() || null,
      delivery_instructions: delivery_instructions?.trim() || null,
      marketing_consent: !!marketing_consent,
    };

    const { profile: updatedProfile, completion } = await updateCustomerProfile(session, profileUpdates);

    // If an address was submitted and the user currently has zero saved addresses, automatically create a default address
    const existingAddresses = await getCustomerAddresses(updatedProfile.id);
    if (
      updatedProfile?.id &&
      profileUpdates.street_address &&
      profileUpdates.city &&
      profileUpdates.postal_code &&
      existingAddresses.length === 0
    ) {
      const fullLine1 = [profileUpdates.apartment_unit, profileUpdates.street_address]
        .filter(Boolean)
        .join(", ");

      await saveCustomerAddress(session, {
        label: "Home",
        recipient_name: profileUpdates.full_name || session.name || "Customer",
        phone: profileUpdates.phone || "",
        line1: fullLine1,
        city: profileUpdates.city,
        state_or_province: profileUpdates.state_or_province || "",
        postal_code: profileUpdates.postal_code,
        country_code: profileUpdates.country,
        is_default: true,
      });
    }

    const response = NextResponse.json({
      success: true,
      profile: updatedProfile,
      completion,
    });

    if (session.isAdmin) {
      response.cookies.set("one_store_user_name", "Store Admin", {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    } else if (profileUpdates.full_name) {
      response.cookies.set("one_store_user_name", profileUpdates.full_name, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
