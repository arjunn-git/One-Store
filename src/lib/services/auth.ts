import { createClient } from "@/lib/supabase/client";

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  isDevDemo?: boolean;
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

    // If Supabase credentials are not yet configured in .env.local, use dev sandbox mode
    if (!isLiveSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("one_store_pending_auth", JSON.stringify({ email: trimmedEmail, mode: "login" }));
      }
      return { success: true, isDevDemo: true };
    }

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate") || error.status === 429) {
        return {
          success: false,
          error: "Too many attempts. Please wait 60 seconds before requesting another code.",
          rateLimited: true,
        };
      }
      if (error.message.toLowerCase().includes("signups not allowed")) {
        return {
          success: false,
          error: "Account not found or new signups are disabled in your Supabase project settings. Please make sure 'Allow new users to sign up' is enabled in your Supabase Auth dashboard.",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    // Graceful fallback to sandbox authentication if network to placeholder fails
    const trimmedEmail = email.trim().toLowerCase();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("one_store_pending_auth", JSON.stringify({ email: trimmedEmail, mode: "login" }));
    }
    return { success: true, isDevDemo: true };
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

    if (!isLiveSupabaseConfigured()) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "one_store_pending_auth",
          JSON.stringify({ email: trimmedEmail, fullName, marketingConsent, mode: "signup" })
        );
      }
      return { success: true, isDevDemo: true };
    }

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true,
        data: {
          full_name: fullName || null,
          marketing_consent: marketingConsent,
        },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate") || error.status === 429) {
        return {
          success: false,
          error: "Rate limit reached. Please wait 60 seconds before requesting a new code.",
          rateLimited: true,
        };
      }
      if (error.message.toLowerCase().includes("signups not allowed")) {
        return {
          success: false,
          error: "Signups are currently disabled in your Supabase project settings. Please go to Authentication -> Configuration -> Providers -> Email in your Supabase dashboard and turn on 'Allow new users to sign up'.",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch {
    const trimmedEmail = email.trim().toLowerCase();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "one_store_pending_auth",
        JSON.stringify({ email: trimmedEmail, fullName, marketingConsent, mode: "signup" })
      );
    }
    return { success: true, isDevDemo: true };
  }
}

// Verify 6-digit OTP code
export async function verifyEmailOtp(
  email: string,
  token: string,
  type: "email" | "signup" = "email"
): Promise<AuthResponse<{ userId: string }>> {
  const trimmedEmail = email.trim().toLowerCase();

  // If in sandbox mode without Supabase credentials
  if (!isLiveSupabaseConfigured()) {
    const role = isAdminEmail(trimmedEmail) ? "owner" : "customer";
    const demoUser = {
      id: `usr_${Date.now()}`,
      email: trimmedEmail,
      full_name: isAdminEmail(trimmedEmail) ? "One Store Administrator" : "One Store Customer",
      role,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("one_store_session", JSON.stringify(demoUser));
      document.cookie = `one_store_user_email=${trimmedEmail}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `one_store_user_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail }),
        });
      } catch {
        // Fallback to client cookie
      }
    }

    return {
      success: true,
      data: { userId: demoUser.id },
      isDevDemo: true,
    };
  }

  try {
    const supabase = createClient();

    // In Supabase Auth, signInWithOtp generates a 'magiclink' token for existing accounts,
    // and a 'signup' token for new registrations. We test candidate types in order of likelihood.
    const candidateTypes: Array<"magiclink" | "signup" | "email"> =
      type === "signup"
        ? ["signup", "magiclink", "email"]
        : ["magiclink", "signup", "email"];

    let verifyResponse: any = null;

    for (const candidateType of candidateTypes) {
      verifyResponse = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token,
        type: candidateType,
      });

      if (!verifyResponse.error && verifyResponse.data?.user) {
        break; // Successfully authenticated!
      }
    }

    const { data, error } = verifyResponse;

    if (error) {
      if (error.message.toLowerCase().includes("expired")) {
        return { success: false, error: "This verification code has expired. Please request a new 6-digit code." };
      }
      if (error.message.toLowerCase().includes("invalid")) {
        return { success: false, error: "Incorrect verification code. Please check the 6 digits in your email." };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Authentication failed. No session established." };
    }

    // Ensure customer_profiles has a matching record
    try {
      await supabase.from("customer_profiles").upsert(
        {
          auth_user_id: data.user.id,
          email: trimmedEmail,
          is_email_verified: true,
          full_name: data.user.user_metadata?.full_name || null,
          role: isAdminEmail(trimmedEmail) ? "owner" : "customer",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "auth_user_id" }
      );
    } catch {
      // Continue even if database sync encounters a network delay
    }

    const role = isAdminEmail(trimmedEmail) ? "owner" : "customer";
    if (typeof window !== "undefined") {
      document.cookie = `one_store_user_email=${trimmedEmail}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `one_store_user_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
    }

    return {
      success: true,
      data: { userId: data.user.id },
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
