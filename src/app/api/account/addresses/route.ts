import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validatePostalCode,
  validatePhoneNumber,
  calculateProfileCompletion,
} from "@/lib/services/profile-validation";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ success: true, addresses: [] });
    }

    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", profile.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, addresses: addresses || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let { data: profile } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    if (!profile) {
      // Auto-create profile if missing
      const { data: newProf, error: pErr } = await supabase
        .from("customer_profiles")
        .insert({
          auth_user_id: authData.user.id,
          email: authData.user.email,
          is_email_verified: !!authData.user.email_confirmed_at,
        })
        .select()
        .single();
      if (pErr) {
        return NextResponse.json({ success: false, error: pErr.message }, { status: 400 });
      }
      profile = newProf;
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

    // Check count of existing addresses: if 0, force is_default = true
    const { count: existingCount } = await supabase
      .from("addresses")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", profile.id);

    const makeDefault = is_default || existingCount === 0;

    if (makeDefault) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", profile.id);
    }

    const validLabels = ["Home", "Work", "Other", "Office", "Warehouse"];
    const safeLabel = validLabels.includes(label) ? label : "Home";

    const { data: newAddress, error } = await supabase
      .from("addresses")
      .insert({
        customer_id: profile.id,
        label: safeLabel,
        recipient_name: recipient_name.trim(),
        phone: phone.trim(),
        line1: line1.trim(),
        line2: line2?.trim() || null,
        city: city.trim(),
        state_or_province: state_or_province.trim(),
        postal_code: postal_code.trim().toUpperCase(),
        country_code: targetCountry,
        is_default: makeDefault,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Recalculate profile completion
    const { data: allAddresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", profile.id);

    const completion = calculateProfileCompletion(profile, allAddresses || []);
    await supabase
      .from("customer_profiles")
      .update({
        is_profile_complete: completion.isComplete,
        profile_completion_percentage: completion.percentage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    return NextResponse.json({ success: true, address: newAddress, completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
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

    // Security: Verify that this address belongs to this customer
    const { data: existingAddress } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("customer_id", profile.id)
      .maybeSingle();

    if (!existingAddress) {
      return NextResponse.json({ success: false, error: "Address not found or unauthorized" }, { status: 404 });
    }

    const targetCountry: "IN" | "GB" = country_code?.toUpperCase() === "GB" ? "GB" : "IN";

    if (phone && !validatePhoneNumber(phone, targetCountry)) {
      return NextResponse.json({ success: false, error: "Invalid mobile number" }, { status: 400 });
    }
    if (postal_code && !validatePostalCode(postal_code, targetCountry)) {
      return NextResponse.json({ success: false, error: "Invalid postal code" }, { status: 400 });
    }

    if (is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", profile.id);
    }

    const validLabels = ["Home", "Work", "Other", "Office", "Warehouse"];
    const safeLabel = label && validLabels.includes(label) ? label : undefined;

    const { data: updatedAddress, error } = await supabase
      .from("addresses")
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("customer_id", profile.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Recalculate profile completion
    const { data: allAddresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", profile.id);

    const completion = calculateProfileCompletion(profile, allAddresses || []);
    await supabase
      .from("customer_profiles")
      .update({
        is_profile_complete: completion.isComplete,
        profile_completion_percentage: completion.percentage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    return NextResponse.json({ success: true, address: updatedAddress, completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });
    }

    // Security: Only delete if the address belongs to this customer
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("customer_id", profile.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // If deleted address was default, set another address as default if one exists
    const { data: remainingAddresses } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", profile.id)
      .order("created_at", { ascending: false });

    if (remainingAddresses && remainingAddresses.length > 0) {
      const hasDefault = remainingAddresses.some((a) => a.is_default);
      if (!hasDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", remainingAddresses[0].id);
      }
    }

    // Recalculate profile completion
    const { data: freshProfile } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("id", profile.id)
      .single();

    const completion = calculateProfileCompletion(freshProfile, remainingAddresses || []);
    await supabase
      .from("customer_profiles")
      .update({
        is_profile_complete: completion.isComplete,
        profile_completion_percentage: completion.percentage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    return NextResponse.json({ success: true, completion });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
