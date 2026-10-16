import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileCompletion } from "@/lib/services/profile-validation";

export async function GET() {
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
      .maybeSingle();

    let addresses: any[] = [];
    if (profile?.id) {
      const { data: addrData } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", profile.id)
        .order("is_default", { ascending: false });
      addresses = addrData || [];
    }

    const emailVerified = !!authData.user.email_confirmed_at || profile?.is_email_verified !== false;
    const effectiveProfile = profile
      ? { ...profile, email: authData.user.email, is_email_verified: emailVerified }
      : {
          auth_user_id: authData.user.id,
          email: authData.user.email,
          is_email_verified: emailVerified,
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
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
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

    const targetCountry = country || (preferred_currency === "GBP" ? "GB" : "IN");
    const emailVerified = !!authData.user.email_confirmed_at;

    // Fetch existing addresses to accurately calculate completion
    const { data: existingProfile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .maybeSingle();

    let existingAddresses: any[] = [];
    if (existingProfile?.id) {
      const { data: addrData } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", existingProfile.id);
      existingAddresses = addrData || [];
    }

    // Candidate profile for validation
    const candidateProfile = {
      full_name: full_name?.trim() || null,
      email: authData.user.email,
      is_email_verified: emailVerified || true,
      phone: phone?.trim() || null,
      country: targetCountry,
      preferred_currency: preferred_currency || (targetCountry === "GB" ? "GBP" : "INR"),
      apartment_unit: apartment_unit?.trim() || null,
      street_address: street_address?.trim() || null,
      city: city?.trim() || null,
      state_or_province: state_or_province?.trim() || null,
      postal_code: postal_code?.trim() || null,
      delivery_instructions: delivery_instructions?.trim() || null,
    };

    const completion = calculateProfileCompletion(candidateProfile, existingAddresses);

    const { data: updatedProfile, error: profileError } = await supabase
      .from("customer_profiles")
      .upsert(
        {
          auth_user_id: authData.user.id,
          email: authData.user.email,
          is_email_verified: true,
          full_name: candidateProfile.full_name,
          phone: candidateProfile.phone,
          country: candidateProfile.country,
          preferred_currency: candidateProfile.preferred_currency,
          apartment_unit: candidateProfile.apartment_unit,
          street_address: candidateProfile.street_address,
          city: candidateProfile.city,
          state_or_province: candidateProfile.state_or_province,
          postal_code: candidateProfile.postal_code,
          delivery_instructions: candidateProfile.delivery_instructions,
          is_profile_complete: completion.isComplete,
          profile_completion_percentage: completion.percentage,
          marketing_consent: !!marketing_consent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "auth_user_id" }
      )
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ success: false, error: profileError.message }, { status: 400 });
    }

    // If an address was submitted and user has no saved addresses, automatically create a default address
    if (
      updatedProfile?.id &&
      candidateProfile.street_address &&
      candidateProfile.city &&
      candidateProfile.postal_code &&
      existingAddresses.length === 0
    ) {
      const fullLine1 = [candidateProfile.apartment_unit, candidateProfile.street_address]
        .filter(Boolean)
        .join(", ");

      await supabase.from("addresses").insert({
        customer_id: updatedProfile.id,
        label: "Home",
        recipient_name: candidateProfile.full_name || "Customer",
        phone: candidateProfile.phone || "",
        line1: fullLine1,
        city: candidateProfile.city,
        state_or_province: candidateProfile.state_or_province || "",
        postal_code: candidateProfile.postal_code,
        country_code: candidateProfile.country,
        is_default: true,
      });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      completion,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
