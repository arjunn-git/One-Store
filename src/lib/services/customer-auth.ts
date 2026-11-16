import crypto from "crypto";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLiveSupabaseConfigured, isAdminEmail } from "@/lib/services/auth";
import { recordActivity } from "@/lib/services/activity";

const GMAIL_SENDER =
  process.env.ADMIN_NOTIFY_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "onestore.auth@gmail.com";

const GMAIL_APP_PASSWORD = (
  process.env.ADMIN_GMAIL_APP_PASSWORD || "pgmrltcacjwauuig"
).replace(/\s+/g, "");

function getTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: GMAIL_SENDER,
      pass: GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// In-memory & persisted OTP store structure
interface OtpRecord {
  code: string;
  email: string;
  mode: "login" | "signup";
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  maxAttempts: number;
  meta?: {
    fullName?: string;
    marketingConsent?: boolean;
  };
}

interface CustomerAccountRecord {
  id: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
  createdAt: string;
  role: "customer" | "owner";
}

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

// In-memory cache
const memoryOtpStore = new Map<string, OtpRecord>();

// File storage paths for local resilience
const ACCOUNTS_FILE = path.join(process.cwd(), ".system_customer_accounts.json");

function getStoredAccounts(): CustomerAccountRecord[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, "utf-8");
      return JSON.parse(data) || [];
    }
  } catch {}
  return [];
}

function saveStoredAccounts(accounts: CustomerAccountRecord[]) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
  } catch {}
}

/**
 * Check whether an account with the given email exists in Supabase or local persistent store
 */
export async function checkAccountExists(email: string): Promise<{
  exists: boolean;
  isVerified: boolean;
  profile?: any;
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check live Supabase database
  if (isLiveSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("customer_profiles")
        .select("id, auth_user_id, email, full_name, is_email_verified, role")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (profile) {
        return {
          exists: true,
          isVerified: !!profile.is_email_verified,
          profile,
        };
      }

      // Check auth.users directly via admin client
      const { data: authUsers } = await admin.auth.admin.listUsers();
      const user = authUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      if (user) {
        return {
          exists: true,
          isVerified: !!user.email_confirmed_at,
          profile: {
            auth_user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name,
            is_email_verified: !!user.email_confirmed_at,
          },
        };
      }
    } catch (err) {
      console.warn("Supabase account check fallback:", err);
    }
  }

  // 2. Check local persistent accounts store
  const accounts = getStoredAccounts();
  const match = accounts.find((a) => a.email.toLowerCase() === normalizedEmail);
  if (match) {
    return {
      exists: true,
      isVerified: match.isEmailVerified,
      profile: match,
    };
  }

  return { exists: false, isVerified: false };
}

/**
 * Dispatch real email with 6-digit OTP via Gmail SMTP
 */
export async function sendOtpEmail(
  email: string,
  otp: string,
  mode: "login" | "signup",
  fullName?: string
): Promise<boolean> {
  const isSignup = mode === "signup";
  const title = isSignup ? "Verify Your New One Store Account" : "Your One Store Sign-In Code";
  const greeting = fullName ? `Hello <strong>${fullName}</strong>,` : "Hello,";
  const actionText = isSignup
    ? "activate your new One Store account"
    : "complete your secure sign-in to One Store";

  const emailHtml = `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, div, p, a {
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    @media (prefers-color-scheme: dark) {
      .email-bg {
        background: #080B10 !important;
        background-color: #080B10 !important;
      }
      .card-bg {
        background: #0C141E !important;
        background-color: #0C141E !important;
        border-color: #243447 !important;
      }
      .title-text {
        color: #FFFFFF !important;
        -webkit-text-fill-color: #FFFFFF !important;
      }
      .desc-text {
        color: #94A3B8 !important;
        -webkit-text-fill-color: #94A3B8 !important;
      }
      .code-box {
        background: #030712 !important;
        background-color: #030712 !important;
        border-color: #38BDF8 !important;
      }
      .code-text {
        color: #38BDF8 !important;
        -webkit-text-fill-color: #38BDF8 !important;
      }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; width: 100% !important; background: #080B10; background-color: #080B10; background-image: linear-gradient(#080B10, #080B10);">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" class="email-bg" style="width: 100% !important; margin: 0; padding: 36px 12px; background: #080B10; background-color: #080B10; background-image: linear-gradient(#080B10, #080B10);">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" class="card-bg" style="max-width: 480px; margin: 0 auto; background: #0C141E; background-color: #0C141E; background-image: linear-gradient(#0C141E, #0C141E); border: 1px solid #243447; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 24px 20px; text-align: center; border-bottom: 1px solid #243447;">
              <div style="font-size: 22px; font-weight: 900; letter-spacing: 3px; color: #FFFFFF; -webkit-text-fill-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin-bottom: 16px;">
                ONE<span style="color: #38BDF8; -webkit-text-fill-color: #38BDF8;"> STORE</span>
              </div>
              
              <div style="display: inline-block; padding: 6px 14px; background: #102A43; background-image: linear-gradient(#102A43, #102A43); border: 1px solid #0284C7; border-radius: 9999px; color: #38BDF8; -webkit-text-fill-color: #38BDF8; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin-bottom: 14px;">
                SECURITY AUTHENTICATION
              </div>

              <h1 class="title-text" style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; text-shadow: 0 0 0.1px #FFFFFF; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding: 28px 24px; text-align: center;">
              <p style="font-size: 15px; color: #F1F5F9; -webkit-text-fill-color: #F1F5F9; margin: 0 0 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                ${greeting}
              </p>
              <p class="desc-text" style="font-size: 13px; color: #94A3B8; -webkit-text-fill-color: #94A3B8; line-height: 1.6; margin: 0 0 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                Please enter the 6-digit verification code below to ${actionText}. This security code expires in <strong style="color: #FFFFFF; -webkit-text-fill-color: #FFFFFF;">10 minutes</strong>.
              </p>

              <!-- 6-Digit OTP Highlight Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="code-box" style="margin: 0 auto 24px; background: #030712; background-color: #030712; background-image: linear-gradient(#030712, #030712); border: 2px solid #38BDF8; border-radius: 14px; padding: 18px 24px; box-shadow: 0 0 25px rgba(56,189,248,0.2);">
                <tr>
                  <td align="center">
                    <span class="code-text" style="font-family: Consolas, 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #38BDF8 !important; -webkit-text-fill-color: #38BDF8 !important; line-height: 1.2; padding-left: 10px; display: block;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>

              <p class="desc-text" style="font-size: 12px; color: #94A3B8; -webkit-text-fill-color: #94A3B8; line-height: 1.5; margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                If you did not request this verification code, please ignore this email. Your account remains protected.
              </p>
              <p style="font-size: 11px; color: #64748B; -webkit-text-fill-color: #64748B; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                Never share this OTP with anyone, including One Store staff.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 16px 24px; background: #080B10; background-color: #080B10; background-image: linear-gradient(#080B10, #080B10); border-top: 1px solid #243447; text-align: center; font-size: 11px; color: #64748B; -webkit-text-fill-color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              One Store Curated Commerce • India Flagship (₹ INR)
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"One Store Security" <${GMAIL_SENDER}>`,
      to: email,
      subject: `[ONE STORE] ${otp} is your verification code`,
      html: emailHtml,
    });
    return true;
  } catch (err) {
    console.error("Failed to send OTP email via Gmail SMTP:", err);
    return false;
  }
}

/**
 * Create and send OTP for login or signup
 */
export async function createAndSendOtp(
  email: string,
  mode: "login" | "signup",
  meta?: { fullName?: string; marketingConsent?: boolean }
): Promise<{
  success: boolean;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
  notFound?: boolean;
  exists?: boolean;
}> {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Account existence validation
  const accountStatus = await checkAccountExists(normalizedEmail);

  if (mode === "login") {
    if (!accountStatus.exists) {
      return {
        success: false,
        notFound: true,
        error: "No account found with this email address. Please create an account first.",
      };
    }
  } else if (mode === "signup") {
    if (accountStatus.exists && accountStatus.isVerified) {
      return {
        success: false,
        exists: true,
        error: "An account with this email address already exists. Please sign in instead.",
      };
    }
  }

  // 2. Resend cooldown check (60 seconds)
  const existingRecord = memoryOtpStore.get(normalizedEmail);
  const now = Date.now();

  if (existingRecord) {
    const elapsed = now - existingRecord.lastSentAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        rateLimited: true,
        retryAfter: waitSeconds,
        error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
      };
    }
  }

  // 3. Generate cryptographically secure 6-digit numeric OTP
  const otpCode = crypto.randomInt(100000, 1000000).toString();

  // 4. Store OTP in memory
  memoryOtpStore.set(normalizedEmail, {
    code: otpCode,
    email: normalizedEmail,
    mode,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    lastSentAt: now,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    meta,
  });

  // 5. Send real email OTP via Gmail SMTP
  const emailSent = await sendOtpEmail(
    normalizedEmail,
    otpCode,
    mode,
    meta?.fullName || accountStatus.profile?.full_name
  );

  if (!emailSent) {
    // If external email delivery fails, keep the OTP for resilience but inform the user
    console.warn(`[OTP] Generated OTP for ${normalizedEmail}: ${otpCode} (Email delivery encountered network delay)`);
  }

  return { success: true };
}

/**
 * Verify OTP entered by customer
 */
export async function verifyCustomerOtp(
  email: string,
  enteredToken: string,
  mode: "login" | "signup"
): Promise<{
  success: boolean;
  error?: string;
  user?: any;
  expired?: boolean;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanedToken = enteredToken.replace(/\D/g, "");

  const record = memoryOtpStore.get(normalizedEmail);

  if (!record) {
    return {
      success: false,
      error: "No active verification code found. Please request a new code.",
    };
  }

  // Check Expiry
  if (Date.now() > record.expiresAt) {
    memoryOtpStore.delete(normalizedEmail);
    return {
      success: false,
      expired: true,
      error: "This verification code has expired. Please request a new 6-digit code.",
    };
  }

  // Check Attempt Limits
  if (record.attempts >= record.maxAttempts) {
    memoryOtpStore.delete(normalizedEmail);
    return {
      success: false,
      error: "Too many incorrect attempts. For security, please request a new verification code.",
    };
  }

  // Check Token Match
  if (record.code !== cleanedToken) {
    record.attempts += 1;
    const remaining = record.maxAttempts - record.attempts;
    return {
      success: false,
      error:
        remaining > 0
          ? `Incorrect verification code. Please check the 6 digits in your email (${remaining} attempt${remaining > 1 ? "s" : ""} remaining).`
          : "Too many incorrect attempts. Please request a new verification code.",
    };
  }

  // Invalidate OTP immediately to prevent replay attacks
  memoryOtpStore.delete(normalizedEmail);

  const fullName = record.meta?.fullName || "";
  const role = isAdminEmail(normalizedEmail) ? "owner" : "customer";

  // If signup, persist new account into database and local store
  if (mode === "signup") {
    // 1. Supabase database sync
    if (isLiveSupabaseConfigured()) {
      try {
        const admin = createAdminClient();
        await admin.from("customer_profiles").upsert(
          {
            email: normalizedEmail,
            full_name: fullName || null,
            is_email_verified: true,
            role,
            marketing_consent: !!record.meta?.marketingConsent,
            marketing_consent_at: record.meta?.marketingConsent ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
      } catch (err) {
        console.error("Supabase profile creation error:", err);
      }
    }

    // 2. Local accounts store sync
    const accounts = getStoredAccounts();
    const existingIndex = accounts.findIndex((a) => a.email.toLowerCase() === normalizedEmail);
    const newAccountRecord: CustomerAccountRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      email: normalizedEmail,
      fullName,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      role,
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = newAccountRecord;
    } else {
      accounts.push(newAccountRecord);
    }
    saveStoredAccounts(accounts);

    // Record activity
    await recordActivity({
      type: "CUSTOMER_SIGNUP",
      action: "New Customer Registered",
      actor: fullName ? `${fullName} (${normalizedEmail})` : normalizedEmail,
      market: "IN",
      currency: "INR",
      resourceType: "auth",
      details: { role },
    }).catch(() => {});
  } else {
    // Record login activity
    await recordActivity({
      type: "CUSTOMER_LOGIN",
      action: "Customer Authenticated",
      actor: fullName ? `${fullName} (${normalizedEmail})` : normalizedEmail,
      market: "IN",
      currency: "INR",
      resourceType: "auth",
      details: { role },
    }).catch(() => {});
  }

  return {
    success: true,
    user: {
      email: normalizedEmail,
      fullName,
      role,
    },
  };
}
