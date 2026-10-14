import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);

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

  return NextResponse.redirect(`${origin}/login`, {
    status: 303,
  });
}

