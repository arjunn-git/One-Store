import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, preferred_currency, country, marketing_consent } = body;

    const { data, error } = await supabase
      .from("customer_profiles")
      .upsert(
        {
          auth_user_id: authData.user.id,
          email: authData.user.email,
          is_email_verified: true,
          full_name: full_name !== undefined ? full_name : undefined,
          phone: phone !== undefined ? phone : undefined,
          preferred_currency: preferred_currency || "INR",
          country: country || (preferred_currency === "GBP" ? "GB" : "IN"),
          marketing_consent: !!marketing_consent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "auth_user_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
