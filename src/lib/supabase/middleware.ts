import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { OFFICIAL_ADMIN_EMAIL, verifyAdminTokenEdge } from "@/lib/services/admin-shared";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const adminToken = request.cookies.get("one_store_admin_token")?.value;

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
        authenticatedEmail = data.user.email.toLowerCase().trim();
      }
    } catch {
      authenticatedEmail = null;
    }
  }

  // Check signed admin token if Supabase session is not already active
  let hasValidAdminToken = false;
  if (adminToken) {
    const tokenResult = await verifyAdminTokenEdge(adminToken);
    if (tokenResult.valid && tokenResult.email === OFFICIAL_ADMIN_EMAIL) {
      hasValidAdminToken = true;
      if (!authenticatedEmail) {
        authenticatedEmail = OFFICIAL_ADMIN_EMAIL;
      }
    }
  }

  const isVerifiedAdmin =
    (authenticatedEmail === OFFICIAL_ADMIN_EMAIL) || hasValidAdminToken;
  const isCustomerAuthenticated = !!authenticatedEmail && !isVerifiedAdmin;

  // 1. OAuth code redirect handling (only for storefront pages, never API routes)
  if (
    request.nextUrl.searchParams.has("code") &&
    pathname !== "/auth/callback" &&
    !pathname.startsWith("/api/")
  ) {
    const code = request.nextUrl.searchParams.get("code");
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", code!);
    return NextResponse.redirect(callbackUrl);
  }

  // 2. Redirect legacy /admin routes to /admin-portal
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const targetSubpath = pathname.replace(/^\/admin/, "");
    const targetPath =
      targetSubpath === "" || targetSubpath === "/"
        ? "/admin-portal/dashboard"
        : `/admin-portal${targetSubpath}`;
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    return NextResponse.redirect(url);
  }

  // 3. Isolated Admin Portal Routes (/admin-portal/*)
  if (pathname === "/admin-portal") {
    const url = request.nextUrl.clone();
    url.pathname = isVerifiedAdmin ? "/admin-portal/dashboard" : "/admin-portal/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin-portal/login") {
    // If admin is already authenticated, take them directly to the admin dashboard
    if (isVerifiedAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-portal/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    // Otherwise allow viewing the admin login screen
    return supabaseResponse;
  }

  if (pathname.startsWith("/admin-portal")) {
    // Admin dashboard / orders / products / inventory routes
    if (!isVerifiedAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin-portal/login";
      if (isCustomerAuthenticated) {
        url.searchParams.set("error", "access_denied");
      } else {
        url.searchParams.set("next", pathname);
      }
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 4. Customer login/signup isolation
  // Customer pages must NEVER redirect to the admin portal
  if ((pathname === "/login" || pathname === "/signup") && isCustomerAuthenticated) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const target = nextParam && !nextParam.startsWith("/admin") ? nextParam : "/account";
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 5. Customer account protection
  if (pathname.startsWith("/account")) {
    if (!authenticatedEmail && !request.cookies.get("one_store_user_email")?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // 6. Mandatory Authentication for Checkout & Orders
  if (pathname === "/checkout" || pathname === "/checkout/") {
    if (!authenticatedEmail && !request.cookies.get("one_store_user_email")?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", "/checkout");
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/orders")) {
    if (!authenticatedEmail && !request.cookies.get("one_store_user_email")?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
