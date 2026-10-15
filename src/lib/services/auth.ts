import { createClient } from "@/lib/supabase/client";

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
  isDevDemo?: boolean;
}

export const ADMIN_EMAILS = ["arjuntaneja204@gmail.com"];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
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
        shouldCreateUser: false,
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
      full_name: isAdminEmail(trimmedEmail) ? "Arjun Taneja (Admin)" : "One Store Customer",
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

    // 1. Primary verification attempt
    let verifyResponse = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token,
      type: type === "signup" ? "signup" : "email",
    });

    // 2. If primary failed with invalid/expired token, fallback to alternate OTP type
    // (Supabase internally switches token type between 'email' and 'signup' depending on user existence)
    if (
      verifyResponse.error &&
      (verifyResponse.error.message.toLowerCase().includes("invalid") ||
        verifyResponse.error.message.toLowerCase().includes("expired"))
    ) {
      const fallbackType = type === "signup" ? "email" : "signup";
      const fallbackResponse = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token,
        type: fallbackType,
      });

      if (!fallbackResponse.error && fallbackResponse.data.user) {
        verifyResponse = fallbackResponse;
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
export async function signInWithGoogle(): Promise<AuthResponse> {
  if (!isLiveSupabaseConfigured()) {
    return {
      success: false,
      error: "Google OAuth credentials (Client ID & Secret) are not yet configured in Supabase. Please use Email OTP.",
    };
  }

  try {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) return { success: false, error: error.message };
    if (data.url) {
      window.location.href = data.url;
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unable to initialize Google Sign-In";
    return { success: false, error: msg };
  }
}

// Apple Sign-In
export async function signInWithApple(): Promise<AuthResponse> {
  if (!isLiveSupabaseConfigured()) {
    return {
      success: false,
      error: "Apple Sign-In credentials are not yet configured in Supabase. Please use Email OTP.",
    };
  }

  try {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) return { success: false, error: error.message };
    if (data.url) {
      window.location.href = data.url;
    }
    return { success: true };
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
