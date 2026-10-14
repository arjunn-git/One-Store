import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      .single();

    if (!profile) {
      return NextResponse.json({ success: true, addresses: [] });
    }

    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", profile.id)
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

    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: "Customer profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { recipient_name, phone, line1, line2, city, state_or_province, postal_code, country_code, is_default } = body;

    if (!recipient_name || !phone || !line1 || !city || !state_or_province || !postal_code || !country_code) {
      return NextResponse.json({ success: false, error: "Missing required address fields" }, { status: 400 });
    }

    // If setting default, unset others first
    if (is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", profile.id);
    }

    const { data: newAddress, error } = await supabase
      .from("addresses")
      .insert({
        customer_id: profile.id,
        recipient_name,
        phone,
        line1,
        line2: line2 || null,
        city,
        state_or_province,
        postal_code,
        country_code: country_code.toUpperCase(),
        is_default: !!is_default,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, address: newAddress });
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });
    }

    const { error } = await supabase.from("addresses").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
