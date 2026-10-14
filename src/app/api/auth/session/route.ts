import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/services/auth";
import { cookies } from "next/headers";

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
  cookieStore.delete("one_store_user_email");
  cookieStore.delete("one_store_user_role");
  return NextResponse.json({ success: true });
}
