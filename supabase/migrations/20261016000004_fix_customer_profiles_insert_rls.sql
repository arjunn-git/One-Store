-- ==============================================================================
-- ONE STORE: Fix Customer Profiles INSERT RLS & Service Role Access
-- Migration: 20261016000004_fix_customer_profiles_insert_rls.sql
-- ==============================================================================

-- 1. Ensure customer_profiles has an INSERT policy for authenticated users
DROP POLICY IF EXISTS "Customers can insert their own profile" ON public.customer_profiles;
CREATE POLICY "Customers can insert their own profile"
  ON public.customer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- 2. Ensure customer_profiles has an explicit UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Customers can update their own profile" ON public.customer_profiles;
CREATE POLICY "Customers can update their own profile"
  ON public.customer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 3. Ensure service_role has unconstrained full access to customer_profiles
DROP POLICY IF EXISTS "Service role full access on customer_profiles" ON public.customer_profiles;
CREATE POLICY "Service role full access on customer_profiles"
  ON public.customer_profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Ensure service_role has unconstrained full access to addresses
DROP POLICY IF EXISTS "Service role full access on addresses" ON public.addresses;
CREATE POLICY "Service role full access on addresses"
  ON public.addresses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
