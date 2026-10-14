import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/services/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const isAdmin = isAdminEmail(user.email);
      const destination = nextParam || (isAdmin ? "/admin" : "/account");

      // Idempotently ensure canonical profile exists
      try {
        await supabase.from("customer_profiles").upsert(
          {
            auth_user_id: user.id,
            email: user.email,
            is_email_verified: !!user.email_confirmed_at,
            phone: user.phone || null,
            is_phone_verified: !!user.phone_confirmed_at,
            full_name: user.user_metadata?.full_name || null,
            marketing_consent: !!user.user_metadata?.marketing_consent,
            marketing_consent_at: user.user_metadata?.marketing_consent
              ? new Date().toISOString()
              : null,
          },
          { onConflict: "auth_user_id" }
        );
      } catch {
        // Continue even if database sync encounters a network hiccup
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      let response: NextResponse;
      if (isLocalEnv) {
        response = NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        response = NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        response = NextResponse.redirect(`${origin}${destination}`);
      }

      if (user.email) {
        response.cookies.set("one_store_user_email", user.email, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        });
        response.cookies.set("one_store_user_role", isAdmin ? "owner" : "customer", {
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
          sameSite: "lax",
        });
      }

      return response;
    }
  }

  // Redirect to an error recovery page if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth_exchange_failed`);
}
