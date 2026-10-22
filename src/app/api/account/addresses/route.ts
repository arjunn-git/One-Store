import { NextResponse } from "next/server";
import {
  resolveServerSession,
  getOrCreateCustomerProfile,
  getCustomerAddresses,
  saveCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
} from "@/lib/services/server-auth";
import {
  validatePostalCode,
  validatePhoneNumber,
} from "@/lib/services/profile-validation";

export async function GET() {
  try {
    const session = await resolveServerSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getOrCreateCustomerProfile(session);
    const addresses = await getCustomerAddresses(profile.id);

    return NextResponse.json({ success: true, addresses });
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
      label,
      recipient_name,
      phone,
      line1,
      line2,
      city,
      state_or_province,
      postal_code,
      country_code,
      is_default,
    } = body;

    const targetCountry: "IN" | "GB" = country_code?.toUpperCase() === "GB" ? "GB" : "IN";

    if (!recipient_name?.trim()) {
      return NextResponse.json({ success: false, error: "Recipient name is required" }, { status: 400 });
    }
    if (!line1?.trim()) {
      return NextResponse.json({ success: false, error: "Address line 1 is required" }, { status: 400 });
    }
    if (!city?.trim()) {
      return NextResponse.json({ success: false, error: "City or town is required" }, { status: 400 });
    }
    if (!state_or_province?.trim()) {
      return NextResponse.json({ success: false, error: "State or province is required" }, { status: 400 });
    }

    if (!validatePhoneNumber(phone, targetCountry)) {
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

    if (!validatePostalCode(postal_code, targetCountry)) {
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

    const validLabels = ["Home", "Work", "Other", "Office", "Warehouse"];
    const safeLabel = validLabels.includes(label) ? label : "Home";

    const { address, completion } = await saveCustomerAddress(session, {
      label: safeLabel,
      recipient_name: recipient_name.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      line2: line2?.trim() || null,
      city: city.trim(),
      state_or_province: state_or_province.trim(),
      postal_code: postal_code.trim().toUpperCase(),
      country_code: targetCountry,
      is_default: !!is_default,
    });

    return NextResponse.json({ success: true, address, completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await resolveServerSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      label,
      recipient_name,
      phone,
      line1,
      line2,
      city,
      state_or_province,
      postal_code,
      country_code,
      is_default,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });
    }

    const targetCountry: "IN" | "GB" = country_code?.toUpperCase() === "GB" ? "GB" : "IN";

    if (phone && !validatePhoneNumber(phone, targetCountry)) {
      return NextResponse.json({ success: false, error: "Invalid mobile number" }, { status: 400 });
    }
    if (postal_code && !validatePostalCode(postal_code, targetCountry)) {
      return NextResponse.json({ success: false, error: "Invalid postal code" }, { status: 400 });
    }

    const validLabels = ["Home", "Work", "Other", "Office", "Warehouse"];
    const safeLabel = label && validLabels.includes(label) ? label : undefined;

    const result = await updateCustomerAddress(session, id, {
      label: safeLabel,
      recipient_name: recipient_name?.trim(),
      phone: phone?.trim(),
      line1: line1?.trim(),
      line2: line2?.trim() !== undefined ? line2.trim() || null : undefined,
      city: city?.trim(),
      state_or_province: state_or_province?.trim(),
      postal_code: postal_code?.trim().toUpperCase(),
      country_code: targetCountry,
      is_default: is_default !== undefined ? !!is_default : undefined,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: "Address not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, address: result.address, completion: result.completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await resolveServerSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });
    }

    const result = await deleteCustomerAddress(session, id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, completion: result.completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
