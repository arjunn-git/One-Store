import { createClient } from "@/lib/supabase/client";

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  isDevDemo?: boolean;
  notFound?: boolean;
  exists?: boolean;
  retryAfter?: number;
}

export const ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "onestore.auth@gmail.com").toLowerCase().trim(),
  "onestore.auth@gmail.com",
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const configuredAdmin = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase().trim();
  return ADMIN_EMAILS.includes(normalized) || (configuredAdmin ? normalized === configuredAdmin : false);
}

// Check if live Supabase project is connected
export function isLiveSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return !!(
    url &&
    !url.includes("placeholder") &&
    !url.includes("your-project-ref") &&
    key &&
    !key.includes("placeholder")
  );
}

// Mask email for privacy (e.g. a***4@gmail.com)
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

// Request OTP for Login
export async function sendLoginOtp(email: string): Promise<AuthResponse> {
  try {
    const trimmedEmail = email.trim().toLowerCase();

    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, mode: "login" }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      if (res.status === 404 || data?.notFound) {
        return {
          success: false,
          notFound: true,
          error: "No account found with this email address. Please create an account first.",
        };
      }
      if (res.status === 429 || data?.rateLimited) {
        return {
          success: false,
          rateLimited: true,
          retryAfter: data?.retryAfter || 60,
          error: data?.error || "Please wait 60 seconds before requesting another code.",
        };
      }
      return {
        success: false,
        error: data?.error || "Unable to send verification code. Please check your email address.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: "Network communication error. Please check your connection and try again.",
    };
  }
}

// Request OTP for Signup
export async function sendSignupOtp(
  email: string,
  fullName?: string,
  marketingConsent: boolean = false
): Promise<AuthResponse> {
  try {
    const trimmedEmail = email.trim().toLowerCase();

    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        mode: "signup",
        fullName,
        marketingConsent,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      if (res.status === 409 || data?.exists) {
        return {
          success: false,
          exists: true,
          error: "An account with this email address already exists. Please sign in instead.",
        };
      }
      if (res.status === 429 || data?.rateLimited) {
        return {
          success: false,
          rateLimited: true,
          retryAfter: data?.retryAfter || 60,
          error: data?.error || "Rate limit reached. Please wait 60 seconds before requesting a new code.",
        };
      }
      return {
        success: false,
        error: data?.error || "Unable to create account. Please try again.",
      };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: "Network communication error. Please check your connection and try again.",
    };
  }
}

// Verify 6-digit OTP code
export async function verifyEmailOtp(
  email: string,
  token: string,
  type: "email" | "signup" = "email"
): Promise<AuthResponse<{ userId: string }>> {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const mode = type === "signup" ? "signup" : "login";

    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        token,
        mode,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || "Verification failed. The code may be invalid or expired.",
      };
    }

    // Set client local storage for immediate UI synchronization
    if (typeof window !== "undefined") {
      const user = data.user;
      localStorage.setItem(
        "one_store_session",
        JSON.stringify({
          id: user.id || `usr_${Date.now()}`,
          email: trimmedEmail,
          full_name: user.fullName || "",
          role: user.role || (isAdminEmail(trimmedEmail) ? "owner" : "customer"),
        })
      );
      if (user.fullName) {
        localStorage.setItem("one_store_user_name", user.fullName);
      }
    }

    return {
      success: true,
      data: { userId: data.user?.id || `usr_${Date.now()}` },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification error occurred.";
    return { success: false, error: msg };
  }
}

// Google OAuth
export async function signInWithGoogle(nextUrl?: string): Promise<AuthResponse> {
  try {
    // 1. Pre-flight check: verify provider is enabled in Supabase so users don't see Supabase's raw JSON 400 page
    const res = await fetch("/api/auth/oauth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google", next: nextUrl }),
    });
    const result = await res.json().catch(() => ({ success: true, configured: true }));
    if (result && (!result.success || result.configured === false)) {
      return {
        success: false,
        error:
          result.error ||
          "Google Sign-In is not enabled yet in your Supabase dashboard. Please configure Google OAuth under Authentication -> Providers.",
      };
    }

    // 2. Client-side PKCE initiation via Supabase SDK
    // This generates the PKCE code_verifier, sets the verifier cookie in the browser, and redirects to Google
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.url) {
      window.location.href = data.url;
      return { success: true };
    }

    return {
      success: false,
      error:
        "Google OAuth is not enabled in your Supabase dashboard. Please enable Google under Authentication -> Providers.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to initialize Google Sign-In";
    return { success: false, error: msg };
  }
}

// Apple Sign-In
export async function signInWithApple(nextUrl?: string): Promise<AuthResponse> {
  try {
    // 1. Pre-flight check: verify provider is enabled in Supabase
    const res = await fetch("/api/auth/oauth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "apple", next: nextUrl }),
    });
    const result = await res.json().catch(() => ({ success: true, configured: true }));
    if (result && (!result.success || result.configured === false)) {
      return {
        success: false,
        error:
          result.error ||
          "Sign in with Apple is not enabled yet in your Supabase dashboard. Please configure Apple OAuth under Authentication -> Providers.",
      };
    }

    // 2. Client-side PKCE initiation via Supabase SDK
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectTo = `${siteUrl}/auth/callback${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data?.url) {
      window.location.href = data.url;
      return { success: true };
    }

    return {
      success: false,
      error:
        "Sign in with Apple is not configured in your Supabase dashboard yet. Please configure your Apple Services ID, Team ID, Key ID, and Private Key in Supabase Authentication -> Providers -> Apple.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to initialize Sign in with Apple";
    return { success: false, error: msg };
  }
}

// Phone SMS OTP (India +91 & UK +44)
export async function sendPhoneOtp(phone: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      return {
        success: false,
        error:
          "SMS provider configuration pending in Supabase. Please use instant Email OTP verification.",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "SMS provider configuration pending in Supabase. Please use instant Email OTP verification.",
    };
  }
}

// Sign Out
export async function signOutUser(): Promise<AuthResponse> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("one_store_session");
    localStorage.removeItem("one_store_user_name");
    document.cookie = "one_store_user_email=; path=/; max-age=0";
    document.cookie = "one_store_user_role=; path=/; max-age=0";
    document.cookie = "one_store_user_name=; path=/; max-age=0";
    document.cookie = "one_store_admin_authenticated=; path=/; max-age=0";
  }

  try {
    // Notify server to clear HTTP-only/secure cookies
    await fetch("/auth/signout", { method: "POST" }).catch(() => {});
  } catch {
    // Non-blocking
  }

  try {
    if (isLiveSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}
