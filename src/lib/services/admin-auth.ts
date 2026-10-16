import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured } from "./auth";
import { cookies } from "next/headers";
import crypto from "crypto";

import { OFFICIAL_ADMIN_EMAIL, ADMIN_SESSION_SECRET } from "./admin-shared";

export { OFFICIAL_ADMIN_EMAIL, ADMIN_SESSION_SECRET };

// -----------------------------------------------------------------------------
// 1. In-Memory Anti-Brute-Force Rate Limiter
// -----------------------------------------------------------------------------
interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const LOCKOUT_MS = 60 * 1000; // 60 seconds lockout

const attemptStore = new Map<string, AttemptRecord>();

export function checkAdminRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = attemptStore.get(identifier);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Check if locked
  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    };
  }

  // Reset window if expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    attemptStore.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.count),
  };
}

export function recordFailedAdminAttempt(identifier: string): {
  locked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = attemptStore.get(identifier);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    attemptStore.set(identifier, {
      count: 1,
      firstAttemptAt: now,
      lockedUntil: 0,
    });
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - 1 };
  }

  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
    return {
      locked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  return {
    locked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.count,
  };
}

export function resetAdminRateLimit(identifier: string): void {
  attemptStore.delete(identifier);
}

// -----------------------------------------------------------------------------
// 2. Cryptographic Admin Session Token (for isolated admin session cookies)
// -----------------------------------------------------------------------------
export function createAdminToken(email: string): string {
  const payload = JSON.stringify({
    email: email.toLowerCase().trim(),
    role: "admin",
    issuedAt: Date.now(),
  });
  const hmac = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + hmac;
}

export function verifyAdminToken(token?: string | null): { valid: boolean; email?: string } {
  if (!token) return { valid: false };
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return { valid: false };

    const payloadStr = Buffer.from(payloadB64, "base64").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", ADMIN_SESSION_SECRET).update(payloadStr).digest("hex");

    if (signature !== expectedSig) return { valid: false };

    const parsed = JSON.parse(payloadStr);
    if (parsed.email !== OFFICIAL_ADMIN_EMAIL) return { valid: false };
    if (parsed.role !== "admin") return { valid: false };

    // Max session age: 7 days
    if (Date.now() - parsed.issuedAt > 7 * 24 * 60 * 60 * 1000) {
      return { valid: false };
    }

    return { valid: true, email: parsed.email };
  } catch {
    return { valid: false };
  }
}

// -----------------------------------------------------------------------------
// 3. Server-Side Admin Request Verifier
// -----------------------------------------------------------------------------
export async function verifyAdminRequest(request?: Request): Promise<{
  authorized: boolean;
  user?: any;
  email?: string;
  error?: string;
  status: number;
}> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("one_store_admin_token")?.value;

  let authenticatedEmail: string | null = null;
  let authUser: any = null;

  // 1. Check Supabase Auth session first
  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();

      if (!error && data?.user?.email) {
        authenticatedEmail = data.user.email.toLowerCase().trim();
        authUser = data.user;
      }
    } catch {
      // Supabase session check failed
    }
  }

  // 2. Check dedicated signed admin token
  if (!authenticatedEmail && adminToken) {
    const tokenResult = verifyAdminToken(adminToken);
    if (tokenResult.valid && tokenResult.email) {
      authenticatedEmail = tokenResult.email;
    }
  }

  // If not authenticated at all
  if (!authenticatedEmail) {
    return {
      authorized: false,
      error: "Authentication required. Please sign in at /admin-portal/login",
      status: 401,
    };
  }

  // Enforce official admin email match
  if (authenticatedEmail !== OFFICIAL_ADMIN_EMAIL) {
    return {
      authorized: false,
      error: "Access Denied: Administrative privileges required. Ordinary customer accounts cannot access the administrative portal.",
      status: 403,
    };
  }

  // 3. Database Role Validation against trusted admin_users table
  if (isLiveSupabaseConfigured()) {
    try {
      const adminDb = createAdminClient();

      // Check admin_users table
      const { data: adminRecord } = await adminDb
        .from("admin_users")
        .select("id, role, is_active")
        .eq("email", OFFICIAL_ADMIN_EMAIL)
        .eq("is_active", true)
        .maybeSingle();

      if (!adminRecord) {
        // Also check customer_profiles table as backup verification
        const { data: profileRecord } = await adminDb
          .from("customer_profiles")
          .select("id, role")
          .eq("email", OFFICIAL_ADMIN_EMAIL)
          .maybeSingle();

        if (profileRecord && (profileRecord.role === "admin" || profileRecord.role === "owner")) {
          // Idempotently sync to admin_users table
          await adminDb.from("admin_users").upsert(
            {
              email: OFFICIAL_ADMIN_EMAIL,
              auth_user_id: authUser?.id || undefined,
              role: "admin",
              is_active: true,
            },
            { onConflict: "email" }
          );
        } else {
          return {
            authorized: false,
            error: "Access Denied: Account not enrolled in authorized administrator registry.",
            status: 403,
          };
        }
      }
    } catch (dbErr) {
      console.warn("Could not query admin_users database table:", dbErr);
    }
  }

  return {
    authorized: true,
    user: authUser || { id: "admin_verified", email: OFFICIAL_ADMIN_EMAIL },
    email: OFFICIAL_ADMIN_EMAIL,
    status: 200,
  };
}
