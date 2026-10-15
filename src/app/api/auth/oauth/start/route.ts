import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, next } = body;

    if (!provider || (provider !== "google" && provider !== "apple")) {
      return NextResponse.json(
        { success: false, error: "Invalid OAuth provider specified." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: `${provider === "google" ? "Google" : "Apple"} OAuth credentials are not configured in your Supabase project.`,
      });
    }

    const callbackUrl = encodeURIComponent(`${siteUrl}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`);
    const authorizeUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${callbackUrl}`;

    // Probe the Supabase authorization endpoint to verify provider configuration
    try {
      const probeRes = await fetch(authorizeUrl, {
        method: "GET",
        headers: {
          "User-Agent": "OneStore-Auth-Probe/1.0",
        },
        redirect: "manual",
        cache: "no-store",
      });

      // If Supabase returns 400 with "Unsupported provider: provider is not enabled"
      if (probeRes.status === 400) {
        const errorData = await probeRes.json().catch(() => null);
        const isNotEnabled =
          errorData?.error_code === "validation_failed" ||
          errorData?.msg?.toLowerCase().includes("not enabled");

        if (isNotEnabled) {
          const providerName = provider === "google" ? "Google" : "Apple";
          return NextResponse.json({
            success: false,
            configured: false,
            error: `${providerName} Sign-In is not enabled yet in your Supabase dashboard. Please configure ${providerName} OAuth credentials under Authentication -> Providers.`,
          });
        }
      }

      // If Supabase returns 303/302 Redirect to the provider's OAuth dialog (e.g. accounts.google.com / appleid.apple.com)
      if (probeRes.status === 303 || probeRes.status === 302 || probeRes.status === 307) {
        const location = probeRes.headers.get("location");
        if (location) {
          return NextResponse.json({
            success: true,
            configured: true,
            url: location,
          });
        }
      }
    } catch {
      // If server probe encounters a network timeout, fallback to the direct authorize URL
    }

    // Return the authorize URL directly if probe was inconclusive
    return NextResponse.json({
      success: true,
      configured: true,
      url: authorizeUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OAuth initiation failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
