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

    const fullName = isAdmin ? "Store Admin" : (body.name || body.fullName || "").trim();
    if (fullName) {
      cookieStore.set("one_store_user_name", fullName, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        httpOnly: false,
      });
    }

    const actorDisplay = isAdmin
      ? `Store Admin (${email})`
      : fullName
      ? `${fullName} (${email})`
      : `${email.split("@")[0]} (${email})`;

    // Record genuine customer login event
    await recordActivity({
      type: "CUSTOMER_LOGIN",
      action: isAdmin ? "Admin Authenticated" : "Customer Authenticated",
      actor: actorDisplay,
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
        name: fullName || undefined,
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
  const name = cookieStore.get("one_store_user_name")?.value || null;
  cookieStore.delete("one_store_user_email");
  cookieStore.delete("one_store_user_name");
  cookieStore.delete("one_store_user_role");

  if (email || name) {
    const actorLabel = name && email ? `${name} (${email})` : name || email || "User";
    await recordActivity({
      type: "CUSTOMER_LOGOUT",
      action: "User Signed Out",
      actor: actorLabel,
      market: "IN",
      currency: "INR",
      resourceType: "auth",
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
