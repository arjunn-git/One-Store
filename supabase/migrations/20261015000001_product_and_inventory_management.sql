-- ==============================================================================
-- ONE STORE: Product & Inventory Management Migration
-- Migration: 20261015000001_product_and_inventory_management.sql
-- ==============================================================================

-- 1. Helper Function to Check Admin Privileges
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.customer_profiles
    WHERE auth_user_id = auth.uid()
    AND (role IN ('admin', 'owner') OR email = 'arjuntaneja204@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enhance Products Table with Supplier, Cost & Regional Fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price_inr NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cost_price_gbp NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS available_in_in BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS available_in_gb BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS shipping_info TEXT;

-- 3. Enhance Product Variants with Cost & Reserved Inventory
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS cost_price_inr NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cost_price_gbp NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS reserved_count INT NOT NULL DEFAULT 0;

-- 4. Create Inventory Movements / Stock Audit Log Table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  change_amount INT NOT NULL,
  previous_count INT NOT NULL,
  new_count INT NOT NULL,
  reason TEXT NOT NULL,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies for Products & Variants
-- Allow admins full CRUD on products
DROP POLICY IF EXISTS "Admins manage all products" ON public.products;
CREATE POLICY "Admins manage all products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Allow public read of active products
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products"
  ON public.products FOR SELECT
  USING (status = 'active' OR public.is_admin_user());

-- Allow admins full CRUD on product variants
DROP POLICY IF EXISTS "Admins manage all variants" ON public.product_variants;
CREATE POLICY "Admins manage all variants"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Allow public read of variants
DROP POLICY IF EXISTS "Public read product variants" ON public.product_variants;
CREATE POLICY "Public read product variants"
  ON public.product_variants FOR SELECT
  USING (TRUE);

-- Allow admins full CRUD on categories
DROP POLICY IF EXISTS "Admins manage all categories" ON public.categories;
CREATE POLICY "Admins manage all categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Allow admins to read inventory movements
DROP POLICY IF EXISTS "Admins view inventory movements" ON public.inventory_movements;
CREATE POLICY "Admins view inventory movements"
  ON public.inventory_movements FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Allow admins to update orders and view all orders
DROP POLICY IF EXISTS "Admins manage all orders" ON public.orders;
CREATE POLICY "Admins manage all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 6. Atomic Inventory Decrement Function for Safe Checkout
CREATE OR REPLACE FUNCTION public.decrement_variant_inventory(
  p_variant_id UUID,
  p_quantity INT,
  p_reason TEXT DEFAULT 'Order checkout reservation'
)
RETURNS JSONB AS $$
DECLARE
  v_current INT;
  v_new INT;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be positive');
  END IF;

  SELECT inventory_count INTO v_current
  FROM public.product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Variant not found');
  END IF;

  IF v_current < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', v_current,
      'requested', p_quantity
    );
  END IF;

  v_new := v_current - p_quantity;

  UPDATE public.product_variants
  SET inventory_count = v_new
  WHERE id = p_variant_id;

  INSERT INTO public.inventory_movements (
    variant_id,
    change_amount,
    previous_count,
    new_count,
    reason,
    performed_by
  ) VALUES (
    p_variant_id,
    -p_quantity,
    v_current,
    v_new,
    p_reason,
    auth.jwt()->>'email'
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_count', v_current,
    'new_count', v_new
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
