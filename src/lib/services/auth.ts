import { createClient } from "@/lib/supabase/client";
import type { CustomerProfile } from "@/lib/types/database";

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimited?: boolean;
}

// Mask email for privacy (e.g. a***n@gmail.com)
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

// Request OTP for Login
export async function sendLoginOtp(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Login must not create new unverified users
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("rate") || error.status === 429) {
        return {
          success: false,
          error: "Too many attempts. Please wait a minute before requesting another code.",
          rateLimited: true,
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to connect to authentication server";
    return { success: false, error: msg };
  }
}

// Request OTP for Signup
export async function sendSignupOtp(
  email: string,
  fullName?: string,
  marketingConsent: boolean = false
): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error. Please check your connection.";
    return { success: false, error: msg };
  }
}

// Verify 6-digit OTP code
export async function verifyEmailOtp(
  email: string,
  token: string,
  type: "email" | "signup" = "email"
): Promise<AuthResponse<{ userId: string }>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: type === "signup" ? "signup" : "email",
    });

    if (error) {
      if (error.message.toLowerCase().includes("expired")) {
        return { success: false, error: "This verification code has expired. Please request a new one." };
      }
      if (error.message.toLowerCase().includes("invalid")) {
        return { success: false, error: "Incorrect verification code. Please check your email and try again." };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Authentication failed. No session established." };
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
      if (error.message.toLowerCase().includes("provider")) {
        return {
          success: false,
          error:
            "SMS OTP provider is currently being configured. Please use Email OTP verification for instant access.",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Phone OTP dispatch failed";
    return { success: false, error: msg };
  }
}

// Sign Out
export async function signOutUser(): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sign out error";
    return { success: false, error: msg };
  }
}
