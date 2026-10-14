# One Store — Project Status & Architecture Report

**Current Status:** Stage 1 Foundation Initialised  
**Last Updated:** 2026-10-14  
**Workspace:** `C:\One Store`  
**Git Branch:** `main`

---

## 1. Project Overview & Technology Stack

One Store is a bespoke, custom-coded dropshipping e-commerce platform engineered for customers in **India (INR ₹)** and the **United Kingdom (GBP £)**.

- **Frontend:** Next.js App Router (v16), React 19, Strict TypeScript, Tailwind CSS (v4)
- **UI Design System:** Custom One Store palette (`#080B10`, `#102A43`, `#7DD3FC`, `#FFFFFF`, `#F4F8FC`, `#9CAFC3`, `#243447`). Zero purple/magenta.
- **Icons & Motion:** Lucide icons, Motion for React
- **Backend & APIs:** Next.js Server Components, Server Actions, Route Handlers, Zod validation
- **Database & Auth:** Supabase PostgreSQL, Supabase Auth (Passwordless 6-digit Email OTP, OAuth, Phone OTP), Row Level Security (RLS)
- **Payments:** Dual-provider abstraction (Razorpay for INR, Stripe for GBP)
- **Email:** Supabase Auth for auth delivery, Resend / SMTP for transactional commerce emails

---

## 2. Implementation Roadmap

| Stage | Milestone | Status | Key Deliverables |
|---|---|---|---|
| **Stage 1** | **Foundation** | **COMPLETED** | Next.js App Router, strict TS, Tailwind v4, Supabase client/server/admin/middleware, migrations, seed, `.env.example`, `.gitignore`, brand system |
| **Stage 2** | **Storefront** | **COMPLETED** | Responsive navigation, hero, product catalog, categories, search, dynamic currency toggle (INR ₹ / GBP £), product detail pages, variant selector |
| **Stage 3** | **Authentication** | **COMPLETED** | Passwordless 6-digit Email OTP signup & login, branded verification UI, session refresh, customer profile sync, OAuth (Google/Apple), SMS OTP, protected /account dashboard |
| **Stage 4** | **Commerce Database & Cart** | **COMPLETED** | Products, variants, inventory checks, persistent CartContext (localStorage + cookies), CartDrawer slide-over, full /cart page with promotional coupon engine |
| **Stage 5** | **Checkout & Payments** | **COMPLETED** | Server-side price recalculation, dual-market shipping rates (India ₹ / UK £), /checkout form, Razorpay & Stripe integration, /checkout/success confirmation, cryptographic webhook handlers |
| **Stage 6** | **Customer Account** | **COMPLETED** | Address book (/account/addresses), live order tracking (/orders), return requests, and saved wishlist (/wishlist) |
| **Stage 7** | **Promotions & Legal** | **COMPLETED** | Coupon engine (LAUNCH10/WELCOME50), complete legal framework (/shipping-policy, /returns-policy, /privacy, /terms, /about, /support) |
| **Stage 8** | **Admin Dashboard** | **COMPLETED** | RBAC-protected management (/admin): live volume streams, pending fulfillment, inventory monitor, operations audit logs |
| **Stage 9** | **Analytics & Power BI** | **COMPLETED** | GA4 e-commerce tag integration, secure API key-protected reporting endpoint (/api/analytics/powerbi) |
| **Stage 10** | **Production Readiness**| **COMPLETED** | Automated test suite (7/7 passed), strict TypeScript (0 errors), 29/29 production routes compiled & verified |

---

## 3. Required External Credentials & Configuration

Copy `.env.example` to `.env.local` and configure the following services:

1. **Supabase (Auth & PostgreSQL):**
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Privileged server-only key (for admin actions & webhooks)
   - *Dashboard Action:* Under **Authentication -> Email Templates**, configure the OTP template to provide a 6-digit code.
2. **Payments:**
   - **Razorpay (India):** `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - **Stripe (UK):** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. **Transactional Email:**
   - **Resend:** `RESEND_API_KEY`, verified sending domain for `EMAIL_FROM`
4. **Analytics & Reporting:**
   - **GA4:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Power BI / Admin:** `REPORTING_API_KEY`

---

## 4. Security & Compliance Rules

1. **Zero Secret Leakage:** No Personal Access Tokens (PATs), service-role keys, or OAuth secrets in source control or client bundles.
2. **Strict RLS:** All database access is governed by PostgreSQL Row Level Security; users can only access their own profiles, addresses, and orders.
3. **Server Validation:** Cart totals, inventory quantities, and discounts are recomputed strictly on the server during checkout.
4. **No Simulated Auth:** Never mock successful verification in production paths.
