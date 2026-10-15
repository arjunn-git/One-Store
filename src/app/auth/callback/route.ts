import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/services/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv = process.env.NODE_ENV === "development";
  const siteBase = isLocalEnv ? origin : forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  // 1. Handle user cancellation or provider rejection gracefully
  if (errorParam || errorDescription) {
    let friendlyMessage = "Social login was not completed. You can sign in using your verification code.";
    if (errorParam === "access_denied" || errorDescription?.toLowerCase().includes("denied")) {
      friendlyMessage = "Sign-in was cancelled. You can sign in using your email code.";
    } else if (errorDescription) {
      friendlyMessage = errorDescription;
    }

    return NextResponse.redirect(
      `${siteBase}/login?error=${encodeURIComponent(friendlyMessage)}`
    );
  }

  // 2. Exchange authorization code for session
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", error.message, error.status);
      return NextResponse.redirect(
        `${siteBase}/login?error=${encodeURIComponent(
          error.message || "Social authentication could not be completed."
        )}`
      );
    }

    if (data?.user) {
      const user = data.user;
      const isAdmin = isAdminEmail(user.email);
      const destination = nextParam || (isAdmin ? "/admin" : "/account");

      // Extract full name from various provider metadata formats (Google vs Apple)
      const meta = user.user_metadata || {};
      const fullName =
        meta.full_name ||
        meta.name ||
        (meta.first_name ? `${meta.first_name} ${meta.last_name || ""}`.trim() : null);

      // Unified identity & canonical profile preservation:
      // We look up by canonical auth_user_id (never merge accounts blindly by email alone)
      try {
        const { data: existingProfile } = await supabase
          .from("customer_profiles")
          .select("id, full_name, email")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (existingProfile) {
          // Preserve existing profile and don't overwrite existing name if Apple omitted it on repeat sign-in
          const updateFields: Record<string, any> = {
            is_email_verified: !!user.email_confirmed_at,
            updated_at: new Date().toISOString(),
          };
          if (fullName && !existingProfile.full_name) {
            updateFields.full_name = fullName;
          }
          if (user.phone) {
            updateFields.phone = user.phone;
            updateFields.is_phone_verified = !!user.phone_confirmed_at;
          }
          await supabase
            .from("customer_profiles")
            .update(updateFields)
            .eq("auth_user_id", user.id);
        } else {
          // Insert new canonical profile
          await supabase.from("customer_profiles").insert({
            auth_user_id: user.id,
            email: user.email,
            is_email_verified: !!user.email_confirmed_at,
            phone: user.phone || null,
            is_phone_verified: !!user.phone_confirmed_at,
            full_name: fullName,
            role: isAdmin ? "owner" : "customer",
            marketing_consent: !!meta.marketing_consent,
            marketing_consent_at: meta.marketing_consent ? new Date().toISOString() : null,
          });
        }
      } catch (profileErr) {
        console.error("[auth/callback] profile sync error:", profileErr);
        // Continue even if database sync encounters a network delay
      }

      const response = NextResponse.redirect(`${siteBase}${destination}`);

      if (user.email) {
        response.cookies.set("one_store_user_email", user.email, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
          secure: !isLocalEnv,
        });
        response.cookies.set("one_store_user_role", isAdmin ? "owner" : "customer", {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
          secure: !isLocalEnv,
        });
      }

      return response;
    }
  }

  // 3. Fallback if code exchange fails or no code was received
  return NextResponse.redirect(`${siteBase}/login?error=auth_exchange_failed`);
}
