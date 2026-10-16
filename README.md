# ONE STORE — Curated Commerce (India & UK Dual-Market)

[![Production Deployment](https://img.shields.io/badge/Vercel-Live%20Storefront-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://one-store-gray.vercel.app/)
[![Next.js 16.4](https://img.shields.io/badge/Next.js-16.4%20Turbopack-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-24%2F24%20Passing-10B981?style=for-the-badge&logo=checkmarx&logoColor=white)](#automated-verification-suite)

> **Live Website:** [https://one-store-gray.vercel.app/](https://one-store-gray.vercel.app/)  
> **Brand Identity:** Engineered Lifestyle, Studio Acoustics, Minimalist Carry, and Precision Chronographs.

---

## Executive Overview

**One Store** is a production-engineered, dual-market dropshipping e-commerce platform that serves customers in **India (INR ₹)** and the **United Kingdom (GBP £)** through the **SAME website URL** with zero customer-facing redirection.

The platform provides localized catalogs, server-validated regional pricing, automated tax and duties calculation, country-specific logistics thresholds, dynamic payment gateway routing, instant-action UI performance, comprehensive technical SEO, and active real-time administrative telemetry.

---

## Key Architectural Highlights

### 1. Same URL, Two Independent Shopping Markets
- **Single Public URL:** Both Indian and UK shoppers use identical URLs (e.g. `/`, `/products`, `/products/[slug]`).
- **Country Selector:** Accessible desktop and mobile country switcher located in the global header with persistent preference cookies (`one_store_market`).
- **Default Behavior:** First-time visitors without a cookie default to India (INR ₹). Selection is preserved throughout navigation and checkout without resetting customer carts.
- **Server-Side Validation:** The currency and market are strictly verified server-side (`src/lib/services/orders.ts` and checkout APIs) to prevent browser tampering.

| Parameter | Market A: India (IN) | Market B: United Kingdom (GB) |
| :--- | :--- | :--- |
| **Currency** | Indian Rupee (`INR`, ₹) | British Pound (`GBP`, £) |
| **Catalog** | India-specific SKU catalog | UK-specific SKU catalog + UK test models |
| **Express Carrier** | Blue Dart Express / Delhivery Air (1–3 Days) | Royal Mail Tracked 24/48 / DPD (1–2 Days) |
| **Free Shipping Threshold** | ₹2,999.00 | £40.00 |
| **Standard Shipping Fee** | ₹149.00 | £3.99 |
| **Payment Gateways** | Razorpay (Instant UPI, Cards, NetBanking) | Stripe (Apple Pay, Klarna, UK Credit/Debit) |
| **Taxes & Duties** | 18% GST (All-inclusive) | 20% UK VAT (All-inclusive) |

---

### 2. Dynamic Regional Payment Mechanism
Payments are dynamically routed and enforced on both client and server:
- **India Checkout:** Automatically instantiates the **Razorpay** checkout engine with native UPI deep-linking, QR code payments, Net Banking, and zero-cost EMI.
- **United Kingdom Checkout:** Automatically initializes **Stripe Elements** with native Apple Pay, Klarna Pay in 3, and UK debit/credit card processing.
- **Security & Integrity:** Payment signatures (`order_id|payment_id` for Razorpay, `client_secret` + webhooks for Stripe) are cryptographically validated server-side. Tampered amounts or mismatched currencies are rejected automatically.

---

### 3. High-Performance UI & Fast Actioning
The storefront is optimized for <1 second First Contentful Paint (FCP) and 60 FPS hardware-accelerated interactions:
- **Zero-Cost 3D Holographic Tilt:** Interactive cards in `ProductCard` and `Hero3DStage` use `requestAnimationFrame` and direct DOM CSS custom properties, bypassing React state re-renders on mousemove for silky smooth 60/120 FPS actioning without main thread blocking (0ms Interaction to Next Paint latency).
- **Tactile Tap Responsiveness:** Native button and link active states (`active:scale-97`) for instant mobile feedback.
- **Next-Gen Image Delivery:** Automatic negotiation of **AVIF** and **WebP** image formats with `compress: true` and lazy loading (`decoding="async"`, `loading="lazy"`).
- **LCP Prioritization:** Critical Largest Contentful Paint images (such as flagship product images) use `fetchPriority="high"` and `loading="eager"`.
- **Route Prefetching:** Primary navigation routes are prefetched on hover and viewport intersection for instantaneous page transitions.
- **Package Import Optimization:** `optimizePackageImports: ["lucide-react"]` ensures tree-shaken icon bundles.
- **Route Loading States:** Top cyber-glow progress bar (`src/app/loading.tsx`) provides immediate visual confirmation on route navigation.

---

### 4. Technical SEO & Schema.org Structured Data
Engineered for rich search engine presence and indexing:
- **Dynamic Sitemap:** `src/app/sitemap.ts` dynamically generates `/sitemap.xml` for all static marketing pages, active categories, and products with updated change frequencies and priorities.
- **Robots Directives:** `src/app/robots.ts` generates standard `/robots.txt` disallowing private administrative and checkout paths while pointing to `/sitemap.xml`.
- **Web App Manifest:** `src/app/manifest.ts` configured for PWA installation.
- **Structured Data (JSON-LD):**
  - **Organization & OnlineStore:** Multi-currency payment methods, contact points, and verified metadata.
  - **WebSite:** Integrated with Schema.org `SearchAction` for Google sitelinks search box.
  - **Product:** Dual-currency `Offer` objects (INR & GBP), SKU, brand, and aggregate ratings.
  - **BreadcrumbList:** Structured breadcrumbs for departmental and product hierarchy.
  - **FAQPage:** Rich FAQ snippets for the `/support` concierge desk.
  - **CollectionPage:** ItemList markup for catalog and category pages.
- **Social Graph Sharing:** Complete OpenGraph (`og:image`, 1200x630) and Twitter Cards (`summary_large_image`) across all routes.

---

### 5. Active Customer Support System
- **Destination Email:** All customer inquiries from `/support` are routed directly to:  
  `onestore.auth@gmail.com`
- **Dual-Delivery Pipeline:** Submissions are processed through a live FormSubmit gateway and Resend API fallback with ticket tracking numbers (`TKT-YYYYMMDD-XXXX`).
- **Live Concierge Telemetry:** Each submitted inquiry triggers an immediate `SUPPORT_INQUIRY` telemetry record appearing live on the `/admin` activity monitor.

---

### 6. Real-Time Admin Command Center (`/admin`)
- **Restricted Access:** Strictly protected and accessible to authorized administrative accounts (`arjuntaneja204@gmail.com`).
- **Live Activity Monitor:** Real-time event streaming for customer checkouts, cart additions, inventory reservations, support inquiries, and market changes.
- **Inventory Control:** Live stock adjustments, low-stock threshold alerts, and UK test catalog status badges.

---

### 7. Isolated UK Test Catalog
A dedicated seed script seeds six clearly identified UK development test products isolated from live inventory:
- `UK-TEST-AUD-001`: Wireless Bluetooth Headphones (£39.99)
- `UK-TEST-HOME-002`: Adjustable LED Desk Lamp (£24.99)
- `UK-TEST-LIFE-003`: Reusable Insulated Water Bottle (£16.99)
- `UK-TEST-PET-004`: Pet Hair Remover Brush (£12.99)
- `UK-TEST-HOME-005`: Motion Sensor Night Light (£14.99)
- `UK-TEST-CAR-006`: Car Cleaning Gel Kit (£9.99)

---

## Brand Aesthetic & Colors

One Store uses an uncompromising, dark luxury theme:
- **Background / Pitch Black:** `#080B10`
- **Card Background / Navy:** `#102A43`
- **Primary Accent / Electric Cyan:** `#7DD3FC`
- **High-Contrast Text / Pure White:** `#FFFFFF`
- **Light Contrast:** `#F4F8FC`
- **Muted Text / Slate:** `#9CAFC3`
- **Borders & Dividers:** `#243447`

*Strictly zero purple, violet, lavender, or magenta.*

---

## Project Structure

```
One Store/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with fonts, SEO & Organization JSON-LD
│   │   ├── loading.tsx               # Instant route loading progress bar
│   │   ├── page.tsx                  # Flagship homepage with 3D stage & featured products
│   │   ├── products/                 # Storefront catalog & [slug] product detail
│   │   ├── categories/               # Department views & [slug] listings
│   │   ├── offers/                   # Active promotions & LAUNCH10 code
│   │   ├── support/                  # Active customer support form & FAQ
│   │   ├── about/                    # Brand philosophy & craft
│   │   ├── shipping-policy/          # Dual-market fulfillment specifications
│   │   ├── returns-policy/           # 14-day customer guarantee
│   │   ├── privacy/                  # GDPR & DPDP compliance terms
│   │   ├── terms/                    # Commercial terms of service
│   │   ├── cart/                     # Shopping bag & checkout staging
│   │   ├── checkout/                 # Dual-market payment checkout
│   │   ├── wishlist/                 # Saved items
│   │   ├── admin/                    # Administrative dashboard & activity telemetry
│   │   ├── sitemap.ts                # Dynamic XML sitemap generator
│   │   ├── robots.ts                 # Dynamic robots.txt generator
│   │   ├── manifest.ts               # Web App Manifest (PWA)
│   │   └── api/                      # Serverless route handlers (support, activity, checkout)
│   ├── components/                   # UI components (storefront, layout, cart, admin)
│   ├── lib/                          # Services, context, Supabase clients & types
│   └── tests/                        # Automated verification suite (24 tests)
├── public/                           # Static public assets & icons
├── supabase/                         # SQL migrations & seed data
├── next.config.ts                    # Next.js performance & image configuration
├── tailwind.config.ts / globals.css  # Tailwind styling & hardware acceleration
└── package.json                      # Dependencies & scripts
```

---

## Automated Verification Suite

Run the full suite of automated unit and integration tests:

```bash
node tests/commerce.test.mjs
```

### Verified Test Cases (24/24 Passing)
1. **Dual Currency Recalculation:** Automatic exchange & formatting for INR (₹) and GBP (£).
2. **Free Shipping Threshold Logic:** Free delivery over ₹2,999 (IN) and £40 (UK).
3. **Promo Code Calculation:** 10% discount validation for `LAUNCH10`.
4. **Cryptographic Webhook Signatures:** HMAC-SHA256 signature verification.
5. **Razorpay Signature Verification:** Validation of `order_id|payment_id` tokens.
6. **Email Privacy Masking:** Masking sensitive PII (`a***@domain.com`).
7. **6-Digit OTP Normalization:** Sanitization and validation of OTP codes.
8. **Inventory Reservation Guard:** Stock boundary check preventing overselling.
9. **Customer Isolation Guard:** Blocking unauthorized customer account access.
10. **Webhook Idempotency:** Duplicate payment event rejection.
11. **Server-Side Price Calculation:** Client-supplied price tampering rejection.
12. **Supabase Dual OTP Fallback:** Signup vs login token resolution.
13. **OTP Cooldown Timer:** 60-second rate-limiting guard.
14. **OAuth Provider Validation:** Google and Apple OAuth redirect checks.
15. **Apple Private Relay Handling:** Preserving user metadata on relay emails.
16. **OAuth Cancellation:** Graceful abort handling without crash.
17. **Multi-Market Server Validation:** Server-side market code validation.
18. **UK Test Catalogue Isolation:** Enforcing `is_test_data` flags.
19. **Currency Formatting Precision:** Accurate zero-decimal INR vs two-decimal GBP formatting.
20. **OAuth Client Failure Handling:** Graceful fallback on missing provider URLs.
21. **Order Reference Normalization:** Normalizing order strings (`OS-2026-IN-XXXX`).
22. **Dynamic Regional Payment Gateway Separation:** Server enforcement of Razorpay vs Stripe.
23. **Real-Time Admin Telemetry:** Ring-buffer logic and live streaming checks.
24. **Customer Support Dispatch:** Inquiry validation, ticket formatting, and delivery to `onestore.auth@gmail.com`.

---

## Getting Started

### 1. Prerequisites
- Node.js `20.x` or higher
- npm `10.x` or higher
- Git

### 2. Installation
```bash
git clone https://github.com/arjunn-git/One-Store.git
cd One-Store
npm install
```

### 3. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Production Build & Type Check
```bash
# Type check TypeScript codebase
npm run type-check

# Build with Next.js Turbopack
npm run build
```

---

## Environment Configuration

Create a `.env.local` file in the root directory:

```ini
# App Configuration
NEXT_PUBLIC_APP_URL=https://one-store-gray.vercel.app

# Supabase Credentials (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay (India Market - INR)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Stripe (UK Market - GBP)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Customer Support & Transactional Email
RESEND_API_KEY=re_your_resend_api_key
SUPPORT_EMAIL_DESTINATION=onestore.auth@gmail.com
```

---

## License

Private and proprietary. Engineered for **One Store Curated Commerce**.
