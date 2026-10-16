import { NextResponse } from "next/server";
import { isAdminEmail, isLiveSupabaseConfigured, maskEmail } from "@/lib/services/auth";
import { recordActivity } from "@/lib/services/activity";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    let email: string | null = null;
    let role: string = "customer";

    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        if (data.user?.email) {
          email = data.user.email.toLowerCase().trim();
        }
      } catch {
        // Fallback to cookies
      }
    }

    if (!email) {
      const cookieStore = await cookies();
      email = cookieStore.get("one_store_user_email")?.value || null;
      role = cookieStore.get("one_store_user_role")?.value || "customer";
    }

    const isAdmin = email ? isAdminEmail(email) : false;

    return NextResponse.json({
      success: true,
      authenticated: !!email,
      user: email ? { email, role: isAdmin ? "owner" : role, isAdmin } : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error reading session";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    }

    const isAdmin = isAdminEmail(email);
    const role = isAdmin ? "owner" : "customer";

    const cookieStore = await cookies();
    cookieStore.set("one_store_user_email", email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false,
    });
    cookieStore.set("one_store_user_role", role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });

    // Record genuine customer login event (masked email for privacy)
    await recordActivity({
      type: "CUSTOMER_LOGIN",
      action: isAdmin ? "Admin Authenticated" : "Customer Authenticated",
      actor: `${maskEmail(email)} (${role})`,
      market: "IN",
      currency: "INR",
      resourceType: "auth",
      details: {
        role,
        isAdmin,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user: {
        email,
        role,
        isAdmin,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Session establishment failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const email = cookieStore.get("one_store_user_email")?.value || null;
  cookieStore.delete("one_store_user_email");
  cookieStore.delete("one_store_user_role");

  if (email) {
    await recordActivity({
      type: "CUSTOMER_LOGOUT",
      action: "User Signed Out",
      actor: maskEmail(email),
      market: "IN",
      currency: "INR",
      resourceType: "auth",
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
