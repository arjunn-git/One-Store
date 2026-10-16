import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.auth.signOut();
      } catch {
        // Continue cleanup
      }
    }

    const cookieStore = await cookies();
    cookieStore.delete("one_store_admin_token");

    return NextResponse.json({
      success: true,
      redirectTo: "/admin-portal/login",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error logging out";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
