-- ==============================================================================
-- ONE STORE — Migration 20261016000001
-- Dedicated Trusted Admin Structure & Anti-Self-Promotion Security
-- ==============================================================================

-- 1. Create Dedicated Trusted admin_users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '["orders", "inventory", "products", "analytics", "support"]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Deny all direct customer modifications on admin_users table
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT
  USING (
    auth.uid() = auth_user_id OR
    LOWER(auth.jwt()->>'email') = LOWER(email)
  );

-- Link existing auth user for onestore.auth@gmail.com if present
INSERT INTO public.admin_users (email, role, is_active)
VALUES ('onestore.auth@gmail.com', 'admin', TRUE)
ON CONFLICT (email) DO UPDATE
SET is_active = TRUE, updated_at = NOW();

-- Auto-link auth_user_id if user exists in auth.users
UPDATE public.admin_users a
SET auth_user_id = u.id
FROM auth.users u
WHERE LOWER(u.email) = LOWER(a.email)
  AND a.auth_user_id IS NULL;

-- 2. Trigger to Strictly Prevent Customers From Elevating Roles (Anti-Self-Promotion Guard)
CREATE OR REPLACE FUNCTION public.prevent_self_role_promotion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- If triggered by authenticated client user directly
    IF auth.uid() IS NOT NULL AND auth.uid() = OLD.auth_user_id THEN
      -- Strict refusal of self-elevation
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_self_role_promotion ON public.customer_profiles;
CREATE TRIGGER trg_prevent_self_role_promotion
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_promotion();

-- 3. Robust Server-Side Admin Authorization Helper Function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  -- 1. Check verified entry in public.admin_users
  IF EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE (auth_user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
    AND is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Check verified customer profile with admin/owner role strictly bound to onestore.auth@gmail.com
  IF EXISTS (
    SELECT 1 FROM public.customer_profiles
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'owner')
    AND LOWER(email) = 'onestore.auth@gmail.com'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
