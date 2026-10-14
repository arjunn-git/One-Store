# One Store

A bespoke, production-grade dropshipping e-commerce platform custom-engineered for dual-market operations in **India (INR ₹)** and the **United Kingdom (GBP £)**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farjunn-git%2FOne-Store)

---

## Brand Architecture & Color Palette

- **Black:** `#080B10`
- **Dark Blue:** `#102A43`
- **Light Blue:** `#7DD3FC`
- **White:** `#FFFFFF`
- **Light Background:** `#F4F8FC`
- **Muted Text:** `#9CAFC3`
- **Border:** `#243447`

*Strictly zero purple, violet, lavender, or magenta.*

---

## Core Stack

- **Framework:** [Next.js App Router](https://nextjs.org/) (React 19)
- **Language:** TypeScript (Strict mode enabled)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Validation:** [Zod](https://zod.dev/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security, passwordless Email OTP)
- **Payments:** Dual abstraction (Razorpay for India INR, Stripe for UK GBP)
- **Email Delivery:** Supabase Auth + Resend transactional API

---

## Getting Started

### 1. Prerequisites

- Node.js `v20+` or `v24+`
- npm `10+` or `11+`
- Git

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your project credentials for Supabase, Razorpay, and Stripe in `.env.local`. **Never commit `.env.local` or any secrets to Git.**

### 3. Database Migration

Run the SQL migration in `supabase/migrations/20261014000001_initial_schema.sql` via the Supabase SQL Editor or Supabase CLI:

```bash
supabase db push
# Or run seed data in development
# supabase/seed.sql
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the storefront.

### 5. Running Type Checks & Build

```bash
# Type check
npm run type-check

# Production build
npm run build
```

---

## Security Guidelines

- **Never** commit GitHub Personal Access Tokens (PATs), private API keys, or service role secrets.
- Always keep `SUPABASE_SERVICE_ROLE_KEY` restricted to server-side route handlers or background jobs.
- Row Level Security (RLS) is enabled on all tables by default.
