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
    cookieStore.set("one_store_admin_token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: "/admin-portal/login",
    });

    response.cookies.set("one_store_admin_token", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error logging out";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
