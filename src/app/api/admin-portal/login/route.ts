import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import {
  OFFICIAL_ADMIN_EMAIL,
  checkAdminRateLimit,
  recordFailedAdminAttempt,
  resetAdminRateLimit,
  createAdminToken,
} from "@/lib/services/admin-auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const clientIp = forwardedFor.split(",")[0].trim() || "127.0.0.1";
    const rateLimitKey = `admin_login_${clientIp}`;

    // 1. Anti-Brute-Force Rate Limit Check
    const rateCheck = checkAdminRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed administrative login attempts. For security, access is temporarily locked. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
          retryAfter: rateCheck.retryAfterSeconds,
          locked: true,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email address and administrative password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // 2. Strict Admin Identity Enforcement
    if (normalizedEmail !== OFFICIAL_ADMIN_EMAIL) {
      const failStatus = recordFailedAdminAttempt(rateLimitKey);
      return NextResponse.json(
        {
          error: "Invalid administrative credentials.",
          remainingAttempts: failStatus.remainingAttempts,
        },
        { status: 401 }
      );
    }

    let authenticationSuccess = false;
    let authUserId: string | null = null;

    // 3. Supabase Auth Verification
    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: String(password),
        });

        if (!error && data?.user) {
          authenticationSuccess = true;
          authUserId = data.user.id;
        } else {
          // If login failed, check if server-configured ADMIN_PASSWORD matches as fallback setup
          const configuredAdminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
          if (configuredAdminPassword && password === configuredAdminPassword) {
            // Update the Supabase password to match using admin service role
            const adminDb = createAdminClient();
            const { data: existingUsers } = await adminDb.auth.admin.listUsers();
            const existingAdmin = existingUsers?.users?.find(
              (u) => u.email?.toLowerCase() === OFFICIAL_ADMIN_EMAIL
            );

            if (existingAdmin) {
              await adminDb.auth.admin.updateUserById(existingAdmin.id, {
                password: String(password),
                email_confirm: true,
              });
              authUserId = existingAdmin.id;
              authenticationSuccess = true;
            } else {
              const { data: newUser } = await adminDb.auth.admin.createUser({
                email: OFFICIAL_ADMIN_EMAIL,
                password: String(password),
                email_confirm: true,
              });
              if (newUser?.user) {
                authUserId = newUser.user.id;
                authenticationSuccess = true;
              }
            }
          }
        }
      } catch (authErr) {
        console.warn("Supabase auth error during admin login:", authErr);
      }
    } else {
      // Offline / Demo / Test mode verification against environment secret
      const configuredAdminPassword =
        process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || "AdminOneStore2026!";
      if (password === configuredAdminPassword) {
        authenticationSuccess = true;
        authUserId = "admin_dev_local";
      }
    }

    // 4. Handle Failure
    if (!authenticationSuccess) {
      const failStatus = recordFailedAdminAttempt(rateLimitKey);
      return NextResponse.json(
        {
          error: "Invalid administrative credentials.",
          remainingAttempts: failStatus.remainingAttempts,
          locked: failStatus.locked,
          retryAfter: failStatus.retryAfterSeconds,
        },
        { status: 401 }
      );
    }

    // 5. Successful Authentication: Reset Rate Limit
    resetAdminRateLimit(rateLimitKey);

    // 6. Ensure Entry in admin_users Table
    if (isLiveSupabaseConfigured() && authUserId) {
      try {
        const adminDb = createAdminClient();
        await adminDb.from("admin_users").upsert(
          {
            email: OFFICIAL_ADMIN_EMAIL,
            auth_user_id: authUserId !== "admin_dev_local" ? authUserId : undefined,
            role: "admin",
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
      } catch (syncErr) {
        console.warn("Could not sync to admin_users table:", syncErr);
      }
    }

    // 7. Issue Cryptographically Signed Admin Session Cookie
    const token = createAdminToken(OFFICIAL_ADMIN_EMAIL);
    const cookieStore = await cookies();
    cookieStore.set("one_store_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/admin-portal/dashboard",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
