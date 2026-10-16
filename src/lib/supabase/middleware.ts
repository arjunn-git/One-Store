import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLiveSupabaseConfigured, isAdminEmail } from "@/lib/services/auth";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const demoEmail = request.cookies.get("one_store_user_email")?.value;

  let authenticatedEmail: string | null = null;

  if (isLiveSupabaseConfigured()) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options as CookieOptions)
            );
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        authenticatedEmail = data.user.email;
      }
    } catch {
      authenticatedEmail = null;
    }
  }

  const activeEmail = authenticatedEmail || demoEmail;
  const isAuthenticated = !!activeEmail;
  const isAdmin = isAdminEmail(activeEmail);

  // If request arrives with ?code= anywhere other than /auth/callback, forward to callback handler
  if (request.nextUrl.searchParams.has("code") && pathname !== "/auth/callback") {
    const code = request.nextUrl.searchParams.get("code");
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", code!);
    return NextResponse.redirect(callbackUrl);
  }

  // If already authenticated and visiting /login or /signup, direct to destination
  if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const target = nextParam || (isAdmin ? "/admin" : "/account");
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Protect admin routes: strictly restricted to authorized administrator accounts
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      // Normal customer accounts can NEVER view admin portal
      const url = request.nextUrl.clone();
      url.pathname = "/account";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Protect account routes
  if (pathname.startsWith("/account")) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
