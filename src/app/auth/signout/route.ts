import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";

export async function POST(request: Request) {
  return handleSignOut(request);
}

export async function GET(request: Request) {
  return handleSignOut(request);
}

async function handleSignOut(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") || "/";

  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignored
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete("one_store_user_email");
  cookieStore.delete("one_store_user_role");

  return NextResponse.redirect(`${origin}${next}`, {
    status: 303,
  });
}

