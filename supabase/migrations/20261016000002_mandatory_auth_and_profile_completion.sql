-- ==============================================================================
-- ONE STORE: Mandatory Authentication, 100% Profile Completion & Address Book
-- Migration: 20261016000002_mandatory_auth_and_profile_completion.sql
-- ==============================================================================

-- 1. Enhance customer_profiles with canonical address and completion fields
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS apartment_unit TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_or_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
  ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- 2. Enhance addresses table with address label (Home, Work, Other)
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'Home' CHECK (label IN ('Home', 'Work', 'Other', 'Office', 'Warehouse'));

-- 3. Ensure Row Level Security is active and hardened on addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers manage own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Customers view own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Customers insert own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Customers update own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Customers delete own addresses" ON public.addresses;

CREATE POLICY "Customers view own addresses"
  ON public.addresses FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers insert own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers update own addresses"
  ON public.addresses FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers delete own addresses"
  ON public.addresses FOR DELETE
  USING (
    customer_id IN (
      SELECT id FROM public.customer_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access on addresses"
  ON public.addresses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Indexes for fast retrieval during checkout
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON public.addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_auth_user ON public.customer_profiles(auth_user_id);
