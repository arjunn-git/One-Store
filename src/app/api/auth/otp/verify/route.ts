import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCustomerOtp } from "@/lib/services/customer-auth";
import { getOrCreateCustomerProfile } from "@/lib/services/server-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token, mode } = body;

    if (!email || !token) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const authMode = mode === "signup" ? "signup" : "login";
    const result = await verifyCustomerOtp(email, token, authMode);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, expired: result.expired },
        { status: 400 }
      );
    }

    const user = result.user;
    const cookieStore = await cookies();

    cookieStore.set("one_store_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      httpOnly: false,
    });

    cookieStore.set("one_store_user_role", user.role || "customer", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      httpOnly: false,
    });

    if (user.fullName) {
      cookieStore.set("one_store_user_name", user.fullName, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        httpOnly: false,
      });
    }

    // Ensure customer profile is initialized
    await getOrCreateCustomerProfile({
      authUserId: null,
      email: user.email,
      role: user.role || "customer",
      isAdmin: user.role === "owner",
      name: user.fullName || null,
      isEmailVerified: true,
      source: "cookie",
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
