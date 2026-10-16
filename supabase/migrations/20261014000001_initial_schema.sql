-- ==============================================================================
-- ONE STORE: Initial PostgreSQL Schema & Row Level Security (RLS)
-- Migration: 20261014000001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'support', 'fulfillment', 'operations', 'admin', 'owner');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending_payment', 'paid', 'processing', 'awaiting_fulfillment',
    'shipped', 'delivered', 'cancelled', 'partially_refunded', 'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Customer Profiles (Linked to Supabase Auth auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  country VARCHAR(2) DEFAULT 'IN',
  preferred_currency VARCHAR(3) DEFAULT 'INR',
  role user_role DEFAULT 'customer',
  marketing_consent BOOLEAN DEFAULT FALSE,
  marketing_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own profile"
  ON public.customer_profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Customers can update their own profile"
  ON public.customer_profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- -----------------------------------------------------------------------------
-- 2. Customer Saved Addresses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state_or_province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL CHECK (country_code IN ('IN', 'GB')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own addresses"
  ON public.addresses FOR ALL
  USING (
    customer_id IN (
      SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 3. Product Categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (is_active = TRUE);

-- -----------------------------------------------------------------------------
-- 4. Products & Variants
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',
  price_inr NUMERIC(12, 2) NOT NULL,
  compare_at_price_inr NUMERIC(12, 2),
  price_gbp NUMERIC(12, 2) NOT NULL,
  compare_at_price_gbp NUMERIC(12, 2),
  sku TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (status = 'active');

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  price_inr_adjustment NUMERIC(12, 2) DEFAULT 0.00,
  price_gbp_adjustment NUMERIC(12, 2) DEFAULT 0.00,
  inventory_count INT NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5,
  options JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product variants" ON public.product_variants FOR SELECT USING (TRUE);

-- -----------------------------------------------------------------------------
-- 5. Orders & Order Items
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customer_profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending_payment',
  payment_status payment_status DEFAULT 'pending',
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('INR', 'GBP')),
  subtotal NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  shipping_fee NUMERIC(12, 2) DEFAULT 0.00,
  tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  promo_code_id UUID,
  payment_provider VARCHAR(50),
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  total_price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own order items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE customer_id IN (
        SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 6. Promo Codes & Campaigns
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  min_spend NUMERIC(12, 2),
  currency_restriction VARCHAR(3) CHECK (currency_restriction IN ('INR', 'GBP', NULL)),
  max_uses INT,
  current_uses INT DEFAULT 0,
  per_customer_limit INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 7. Audit Logs (Server-only logging)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 8. Auto-provision Customer Profile & Admin Role Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_profiles (
    auth_user_id,
    email,
    full_name,
    is_email_verified,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
    NEW.email_confirmed_at IS NOT NULL,
    CASE 
      WHEN LOWER(NEW.email) = 'onestore.auth@gmail.com' THEN 'owner'::user_role
      ELSE 'customer'::user_role
    END
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    is_email_verified = EXCLUDED.is_email_verified,
    role = CASE 
      WHEN LOWER(EXCLUDED.email) = 'onestore.auth@gmail.com' THEN 'owner'::user_role
      ELSE customer_profiles.role
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
