# One Store — Supabase Numeric Email OTP Configuration Guide

This guide details the exact steps and email templates required to deliver a **6-digit numeric verification code** (OTP) instead of a magic link.

---

## 1. Why Did the Email Contain a Clickable Link Instead of a Numeric Code?

In Supabase Auth, calling `supabase.auth.signInWithOtp()` generates both:
1. **A 6-digit numeric verification code**: Accessed in Go templates as `{{ .Token }}`.
2. **A clickable magic link**: Accessed in Go templates as `{{ .ConfirmationURL }}`.

By default, Supabase's default **Magic Link** email template contains only:
```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```
Because the default template omits `{{ .Token }}`, customers only received a clickable link with the subject *"Your sign-in link"*.

---

## 2. Supabase Dashboard Email Templates (Copy & Paste)

Go to **Supabase Dashboard → Authentication → Email Templates**.

### Template 1: Magic Link (Used for Passwordless Login)

1. Open the **Magic Link** tab.
2. Set **Subject**:
   ```
   Your One Store verification code: {{ .Token }}
   ```
3. Replace the **Body** with this One Store branded template:
   ```html
   <div style="background-color: #080B10; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; text-align: center;">
     <div style="max-width: 480px; margin: 0 auto; background-color: #0c141e; border: 1px solid #243447; border-radius: 16px; padding: 36px 28px;">
       <div style="font-size: 14px; font-weight: 700; color: #7DD3FC; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">
         One Store Authentication
       </div>
       <h1 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0 0 10px 0;">
         Your Verification Code
       </h1>
       <p style="font-size: 13px; color: #9CAFC3; line-height: 1.6; margin: 0 0 24px 0;">
         Enter this 6-digit numeric code on the One Store sign-in screen to access your account:
       </p>
       <div style="background-color: #080B10; border: 2px solid #7DD3FC; border-radius: 12px; padding: 16px 24px; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #7DD3FC; font-family: monospace; display: inline-block; margin-bottom: 24px;">
         {{ .Token }}
       </div>
       <p style="font-size: 11px; color: #9CAFC3; margin: 0; line-height: 1.5;">
         This code will expire in <strong>10 minutes</strong>. If you did not request this verification code, you can safely ignore this email.
       </p>
     </div>
   </div>
   ```
4. Click **Save**.

---

### Template 2: Confirm Signup (Used for New Customer Registrations)

1. Open the **Confirm signup** tab.
2. Set **Subject**:
   ```
   Welcome to One Store — Your verification code: {{ .Token }}
   ```
3. Replace the **Body** with:
   ```html
   <div style="background-color: #080B10; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; text-align: center;">
     <div style="max-width: 480px; margin: 0 auto; background-color: #0c141e; border: 1px solid #243447; border-radius: 16px; padding: 36px 28px;">
       <div style="font-size: 14px; font-weight: 700; color: #7DD3FC; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">
         One Store Customer Registration
       </div>
       <h1 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0 0 10px 0;">
         Verify Your Account
       </h1>
       <p style="font-size: 13px; color: #9CAFC3; line-height: 1.6; margin: 0 0 24px 0;">
         Thank you for creating an account with One Store. Enter this 6-digit verification code to activate your account:
       </p>
       <div style="background-color: #080B10; border: 2px solid #7DD3FC; border-radius: 12px; padding: 16px 24px; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #7DD3FC; font-family: monospace; display: inline-block; margin-bottom: 24px;">
         {{ .Token }}
       </div>
       <p style="font-size: 11px; color: #9CAFC3; margin: 0; line-height: 1.5;">
         This code expires in <strong>10 minutes</strong>. Never share this code with anyone.
       </p>
     </div>
   </div>
   ```
4. Click **Save**.

---

## 3. Supabase Auth Configuration Checklist

Ensure the following settings are enabled in your Supabase Dashboard:

### 1. URL Configuration (`Authentication -> URL Configuration`)
- **Site URL**: `https://one-store-gray.vercel.app` (or `http://localhost:3000` for local testing)
- **Redirect URLs** (add these lines):
  ```
  https://one-store-gray.vercel.app/**
  http://localhost:3000/**
  ```

### 2. Email Provider Settings (`Authentication -> Providers -> Email`)
- **Enable Email provider**: `ON`
- **Confirm email**: `ON`
- **Secure passwordless sign-in (OTP)**: `ON`
- **Mailer OTP Expiry**: `600` (10 minutes)
- **Rate Limit**: Supabase enforces a 60-second cooldown between consecutive email requests for the same address to prevent abuse.

---

## 4. How the Application Requests and Verifies Numeric OTPs

### 1. Requesting the OTP
The application initiates OTP delivery via `supabase.auth.signInWithOtp()`:
```typescript
// Login (existing user)
const { error } = await supabase.auth.signInWithOtp({
  email: trimmedEmail,
  options: {
    shouldCreateUser: false,
  },
});

// Signup (new user)
const { error } = await supabase.auth.signInWithOtp({
  email: trimmedEmail,
  options: {
    shouldCreateUser: true,
    data: {
      full_name: fullName,
      marketing_consent: marketingConsent,
    },
  },
});
```

### 2. Verifying the 6-Digit Numeric Code
When the customer enters their 6 digits into the accessible `OtpInput` component, the code is verified via `supabase.auth.verifyOtp()`:
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: trimmedEmail,
  token: otpCode, // 6-digit numeric string entered by the user
  type: 'email',  // with fallback to 'signup'
});
```

### 3. Session & Profile Establishment
Upon successful verification:
- Supabase establishes the secure session cookie.
- The user's canonical `customer_profiles` record is automatically upserted:
  ```typescript
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
  ```
- If the authenticated user is the designated system administrator (matching `ADMIN_EMAIL`), they are automatically directed to `/admin`.
- Normal customers are directed to `/account` (or their checkout destination).
