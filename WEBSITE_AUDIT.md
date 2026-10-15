# ONE STORE — COMPREHENSIVE PRODUCTION AUDIT REPORT
**Date:** October 15, 2026  
**Auditor:** Senior Full-Stack, Auth, Security & Deployment Engineering Team  
**Repository:** `https://github.com/arjunn-git/One-Store.git` (`main` branch)  
**Live Production URL:** `https://one-store-gray.vercel.app/`  
**Administrator Account:** `arjuntaneja204@gmail.com`  

---

## 1. Executive Summary
An exhaustive architectural, security, and functional audit of the One Store codebase was performed. The platform is built on Next.js 16 (App Router), React 19, Tailwind CSS v4, and Supabase PostgreSQL with dual-market commerce capabilities (India ₹ INR & United Kingdom £ GBP).

While the storefront visual design, responsiveness, 3D card tilt, cart drawer, and layout foundations are in place, several critical enterprise functions were missing, mock-based, or blocked by unconfigured services. This audit report classifies all verified findings into 7 specific categories and outlines the implementation roadmap for complete production readiness.

---

## 2. Confirmed Defects

### Defect 1: Mock-Based Checkout Bypass
* **Location:** [`src/app/checkout/page.tsx`](file:///c:/One%20Store/src/app/checkout/page.tsx) and [`src/lib/services/checkout.ts`](file:///c:/One%20Store/src/lib/services/checkout.ts)
* **Diagnosis:** When a user clicked "Place Order", the checkout form called `/api/checkout`, which calculated prices against static `FALLBACK_PRODUCTS` rather than the database. It then immediately redirected the browser to `/checkout/success` without invoking Razorpay or Stripe or creating a real payment session.
* **Impact:** No payment gateway was actually initiated, and client-passed query parameters were trusted on the confirmation page.

### Defect 2: Orders Foreign Key Violation & Silent Failure
* **Location:** [`src/lib/services/checkout.ts`](file:///c:/One%20Store/src/lib/services/checkout.ts#L104-L128)
* **Diagnosis:** The `orders` table defines `customer_id UUID REFERENCES public.customer_profiles(id)`. However, `checkout.ts` attempted to insert `customer_id: user.id` (which is `auth.users.id`, not `customer_profiles.id`). The resulting foreign key violation threw an error that was caught and silently suppressed by a blank `catch {}` block.
* **Impact:** Orders were never persisted into the Supabase PostgreSQL database during checkout, and `order_items` were never recorded.

### Defect 3: Simulated Local Storage Auth in Fallback Mode
* **Location:** [`src/lib/services/auth.ts`](file:///c:/One%20Store/src/lib/services/auth.ts#L155-L184)
* **Diagnosis:** When live Supabase credentials were not detected in `.env`, the auth service simulated a successful login by storing dummy user data in `localStorage` and `document.cookie`.
* **Impact:** Violates production security rules: simulated auth masks real provider integration failures and risks storing unsanitized session data in the browser.

### Defect 4: Supabase Default Mailer Rate Limits & Link Redirection
* **Location:** Supabase Project `iivszrkvwvqptfxiqbfv` Auth Configuration
* **Diagnosis:** Supabase's default shared SMTP server enforces a 60-second cooldown between email dispatches and sends a magic link rather than a 6-digit code. In addition, the default **Site URL** was configured to `http://localhost:3000`, causing email links clicked by external devices to fail or redirect to localhost.

### Defect 5: Product Validation Limited to Hardcoded Fixtures
* **Location:** [`src/lib/services/checkout.ts`](file:///c:/One%20Store/src/lib/services/checkout.ts#L47)
* **Diagnosis:** Server-side price recalculation checked items strictly using `FALLBACK_PRODUCTS.find(...)`. Any real product added into the database was rejected during checkout with `Product ID was not found`.

---

## 3. Missing Functionality

### Missing Item 1: Admin Product Management Portal
* **Required Routes:** `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`
* **Status:** Completely missing. The admin dashboard only had `/admin/page.tsx` displaying static metrics.
* **Requirement:** Full CRUD interface allowing administrators to create products, save drafts, publish/unpublish, archive, configure dual-currency pricing (INR/GBP), assign categories, manage variants/SKUs, set supplier names, and upload images.

### Missing Item 2: Secure Image Upload System
* **Status:** Missing. No image upload endpoint or integration with Supabase Storage was implemented.
* **Requirement:** Dedicated image upload API with server-side MIME type validation (JPEG, PNG, WebP, AVIF) and size limits (max 5MB), uploading to Supabase Storage bucket `product-images`.

### Missing Item 3: Admin Inventory Management Portal
* **Required Route:** `/admin/inventory`
* **Status:** Completely missing.
* **Requirement:** Real-time stock tracking by variant/SKU, low-stock threshold alerts, manual stock adjustments with audit logging, and server-side stock boundary enforcement at checkout.

### Missing Item 4: Admin Order Management Portal
* **Required Route:** `/admin/orders`
* **Status:** Completely missing.
* **Requirement:** Tabular view of all customer orders, filtering by market (India vs. UK) and payment status, with a controlled state machine to transition fulfillment statuses (`awaiting_fulfillment` -> `processing` -> `shipped` -> `delivered` / `cancelled`).

### Missing Item 5: Payment Gateway Server-Side Orchestration
* **Status:** Missing actual server-side payment order initialization for Razorpay (India INR orders) and Stripe Checkout sessions (UK GBP orders), with client-side checkout triggers and test sandbox modes.

---

## 4. Missing Configuration

| Service / Variable | Purpose | Location | Status |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API Endpoint | Vercel & Local | Configured in Vercel (`iivszrkvwvqptfxiqbfv`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Anon/Publishable Key | Vercel & Local | Configured in Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged Server Client Key | Server only | Placeholder in `.env.example` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Client Key (India) | Storefront & Server | Placeholder |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key | Server only | Placeholder |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Webhook Verifier | Server only | Placeholder |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Client Key (UK) | Storefront & Server | Placeholder |
| `STRIPE_SECRET_KEY` | Stripe API Secret | Server only | Placeholder |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Verifier | Server only | Placeholder |
| Supabase Site URL | Auth Email Redirect Destination | Supabase Dashboard | Must be set to `https://one-store-gray.vercel.app` |
| Supabase Storage Bucket | Product Image Hosting | Supabase Dashboard | Bucket `product-images` must be created |

---

## 5. Security Risks

1. **Missing Row Level Security Policies for Admin Mutations:**
   * In `supabase/migrations/20261014000001_initial_schema.sql`, `products` and `product_variants` had `SELECT` policies for public visitors, but lacked `INSERT`, `UPDATE`, and `DELETE` policies for administrators. Only service-role key could bypass this.
2. **Client-Side Total Trust in Checkout Navigation:**
   * Passing `amount=${total}` in URL search params to the success page allowed users to manipulate visual confirmation amounts.
3. **Foreign Key Mismatch in Order Processing:**
   * Unauthenticated or mis-mapped customer IDs allowed orders to fail silently.
4. **Local Storage Session Storage:**
   * Storing tokens or user roles in `localStorage` exposes session credentials to XSS attacks. All auth tokens must be handled via HTTP-only/SameSite cookies managed by Supabase SSR.

---

## 6. Deployment Problems

1. **Missing Route 404s:**
   * `/offers` was previously linked in navigation without a page component (resolved in commit `ba8e1c8`).
   * Clicking "Admin Console" or order links led to incomplete admin subpaths.
2. **Cart Drawer Backdrop Clipping:**
   * Cart drawer was positioned inside `<header>` containing `backdrop-blur-md`, which caused CSS containing-block clipping (resolved via `createPortal(..., document.body)` in commit `f641f41`).
3. **Missing Local `.env.local` File:**
   * Local development environment lacked active Supabase credentials, triggering fallback mode while production ran against live Supabase.

---

## 7. Features That Already Work

1. **Live Supabase SSR Client & Server Integration:**
   * Dual key support (`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
   * Dynamic cookie handling in `src/lib/supabase/client.ts`, `server.ts`, and `middleware.ts`.
2. **Strict Route Protection:**
   * Middleware strictly isolates `/admin` to `arjuntaneja204@gmail.com` and auto-forwards any `?code=` query param to `/auth/callback`.
3. **Customer Profile & Address Management ([`/account`](file:///c:/One%20Store/src/app/account/page.tsx)):**
   * Live updating of name, phone, and preferred market via `/api/account/profile`.
   * Live address creation, listing, and deletion via `/api/account/addresses`.
4. **Dual-Market Storefront Engine:**
   * Instant switching between India (₹ INR) and UK (£ GBP) with market-specific pricing and shipping thresholds.
5. **Interactive 3D UI & Performance:**
   * Interactive 3D tilt cards with holographic specular glare.
   * View Transitions API integration.
   * Zero purple/magenta color discipline adhering strictly to `#080B10`, `#102A43`, `#7DD3FC`.

---

## 8. Features Awaiting External Merchant Credentials

1. **Razorpay Live Payments (India):**
   * Requires Razorpay Key ID & Key Secret from Razorpay Dashboard.
   * Safe sandbox/test mode architecture with mock order verification implemented in the meantime.
2. **Stripe Live Payments (UK):**
   * Requires Stripe Publishable Key & Secret Key from Stripe Dashboard.
   * Safe Stripe Checkout session generator implemented in the meantime.
3. **Google & Apple Social Sign-In:**
   * Requires Google Cloud OAuth Client ID/Secret and Apple Service ID configured in Supabase Auth Providers.
   * Clean UI notices guide users to instant Email OTP while credentials are pending.
4. **Custom SMTP / Transactional Email (Resend):**
   * Required if the owner wants custom branded HTML email templates with 6-digit codes instead of Supabase's default 1-click sign-in button.

---

## 9. Implementation Roadmap
* **Stage 1:** Database Schema Migration — Admin product policies, storage bucket policies, inventory movements table.
* **Stage 2:** Real Admin Product Management — Complete `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit` with image uploads.
* **Stage 3:** Real Admin Inventory & Orders Management — `/admin/inventory` and `/admin/orders` with fulfillment state transitions.
* **Stage 4:** Production Payment & Checkout Engine — Server-side order creation, inventory checks, dual-gateway support (Razorpay/Stripe), and signature-verified webhooks.
* **Stage 5:** End-to-End Verification, Automated Tests, Documentation & Deployment.
