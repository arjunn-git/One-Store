-- ==============================================================================
-- ONE STORE: Multi-Market UK Test Catalogue & Migration
-- Migration: 20261015000002_uk_multimarket_and_test_catalogue.sql
-- ==============================================================================

-- 1. Add is_test_data column to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN DEFAULT FALSE;

-- 2. Index for market and test data filtering
CREATE INDEX IF NOT EXISTS idx_products_market_status
  ON public.products (available_in_in, available_in_gb, status, is_test_data);

-- 3. Upsert UK Test Categories
INSERT INTO public.categories (id, slug, name, description, image_url, is_active)
VALUES
  (
    'c5000000-0000-0000-0000-000000000005',
    'electronics',
    'Electronics',
    'High-performance consumer electronics engineered for clarity and wireless mobility.',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
    TRUE
  ),
  (
    'c6000000-0000-0000-0000-000000000006',
    'home-office',
    'Home Office',
    'Ergonomic studio fixtures, illumination, and workspace productivity essentials.',
    'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=800&q=80',
    TRUE
  ),
  (
    'c7000000-0000-0000-0000-000000000007',
    'home-and-lifestyle',
    'Home and Lifestyle',
    'Thermal drinkware and minimalist daily lifestyle essentials.',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    TRUE
  ),
  (
    'c8000000-0000-0000-0000-000000000008',
    'pet-accessories',
    'Pet Accessories',
    'Specialized pet care accessories and grooming solutions.',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
    TRUE
  ),
  (
    'c9000000-0000-0000-0000-000000000009',
    'home-accessories',
    'Home Accessories',
    'Motion-activated ambient fixtures and modern home convenience accessories.',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80',
    TRUE
  ),
  (
    'c1000000-0000-0000-0000-000000000010',
    'car-accessories',
    'Car Accessories',
    'Precision vehicle interior detailing kits and automotive maintenance tools.',
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- 4. Idempotently Upsert the 6 UK Sample Test Products
-- Product 1: Wireless Bluetooth Headphones (Electronics, £39.99, compare £49.99, SKU: UK-TEST-AUD-001, stock: 20)
INSERT INTO public.products (
  id, slug, name, description, category_id, images,
  price_inr, compare_at_price_inr, price_gbp, compare_at_price_gbp,
  sku, status, is_featured, is_test_data, available_in_in, available_in_gb,
  supplier_name, shipping_info, seo_title, seo_description
)
VALUES (
  'p5000000-0000-0000-0000-000000000001',
  'wireless-bluetooth-headphones-uk-test',
  'Wireless Bluetooth Headphones',
  '[DEVELOPMENT TEST RECORD] Over-ear acoustic wireless Bluetooth headphones with passive noise isolation, 40mm drivers, and 30-hour playback.',
  'c5000000-0000-0000-0000-000000000005',
  ARRAY['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80'],
  4299.00, 5499.00, 39.99, 49.99,
  'UK-TEST-AUD-001', 'active', TRUE, TRUE, FALSE, TRUE,
  'UK Dev Fixture (Manual Inventory)', 'Royal Mail Tracked 24/48 Dispatch',
  'Wireless Bluetooth Headphones (UK Test) — One Store',
  'Development test catalogue record for UK market.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_gbp = EXCLUDED.price_gbp,
  compare_at_price_gbp = EXCLUDED.compare_at_price_gbp,
  is_test_data = TRUE,
  available_in_in = FALSE,
  available_in_gb = TRUE;

INSERT INTO public.product_variants (
  id, product_id, name, sku, price_inr_adjustment, price_gbp_adjustment, inventory_count, low_stock_threshold, options
)
VALUES (
  'v5000000-0000-0000-0000-000000000001',
  'p5000000-0000-0000-0000-000000000001',
  'Matte Black',
  'UK-TEST-AUD-001',
  0, 0, 20, 5, '{"Color": "Matte Black"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  inventory_count = EXCLUDED.inventory_count;

-- Product 2: Adjustable LED Desk Lamp (Home Office, £24.99, compare £29.99, SKU: UK-TEST-HOME-002, stock: 15)
INSERT INTO public.products (
  id, slug, name, description, category_id, images,
  price_inr, compare_at_price_inr, price_gbp, compare_at_price_gbp,
  sku, status, is_featured, is_test_data, available_in_in, available_in_gb,
  supplier_name, shipping_info, seo_title, seo_description
)
VALUES (
  'p5000000-0000-0000-0000-000000000002',
  'adjustable-led-desk-lamp-uk-test',
  'Adjustable LED Desk Lamp',
  '[DEVELOPMENT TEST RECORD] Architectural articulated desk lamp with 5 colour temperature presets, touch stepless dimming, and integrated USB-A charging port.',
  'c6000000-0000-0000-0000-000000000006',
  ARRAY['https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=800&q=80'],
  2699.00, 3299.00, 24.99, 29.99,
  'UK-TEST-HOME-002', 'active', FALSE, TRUE, FALSE, TRUE,
  'UK Dev Fixture (Manual Inventory)', 'Royal Mail Tracked 24/48 Dispatch',
  'Adjustable LED Desk Lamp (UK Test) — One Store',
  'Development test catalogue record for UK market.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_gbp = EXCLUDED.price_gbp,
  compare_at_price_gbp = EXCLUDED.compare_at_price_gbp,
  is_test_data = TRUE,
  available_in_in = FALSE,
  available_in_gb = TRUE;

INSERT INTO public.product_variants (
  id, product_id, name, sku, price_inr_adjustment, price_gbp_adjustment, inventory_count, low_stock_threshold, options
)
VALUES (
  'v5000000-0000-0000-0000-000000000002',
  'p5000000-0000-0000-0000-000000000002',
  'Anodized Silver',
  'UK-TEST-HOME-002',
  0, 0, 15, 4, '{"Finish": "Anodized Silver"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  inventory_count = EXCLUDED.inventory_count;

-- Product 3: Reusable Insulated Water Bottle (Home and Lifestyle, £16.99, compare £21.99, SKU: UK-TEST-LIFE-003, stock: 30)
INSERT INTO public.products (
  id, slug, name, description, category_id, images,
  price_inr, compare_at_price_inr, price_gbp, compare_at_price_gbp,
  sku, status, is_featured, is_test_data, available_in_in, available_in_gb,
  supplier_name, shipping_info, seo_title, seo_description
)
VALUES (
  'p5000000-0000-0000-0000-000000000003',
  'reusable-insulated-water-bottle-uk-test',
  'Reusable Insulated Water Bottle',
  '[DEVELOPMENT TEST RECORD] Double-wall vacuum insulated 18/8 food-grade stainless steel bottle keeping liquids cold for 24h and hot for 12h. Leakproof seal.',
  'c7000000-0000-0000-0000-000000000007',
  ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80'],
  1799.00, 2299.00, 16.99, 21.99,
  'UK-TEST-LIFE-003', 'active', TRUE, TRUE, FALSE, TRUE,
  'UK Dev Fixture (Manual Inventory)', 'Royal Mail Tracked 24/48 Dispatch',
  'Reusable Insulated Water Bottle (UK Test) — One Store',
  'Development test catalogue record for UK market.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_gbp = EXCLUDED.price_gbp,
  compare_at_price_gbp = EXCLUDED.compare_at_price_gbp,
  is_test_data = TRUE,
  available_in_in = FALSE,
  available_in_gb = TRUE;

INSERT INTO public.product_variants (
  id, product_id, name, sku, price_inr_adjustment, price_gbp_adjustment, inventory_count, low_stock_threshold, options
)
VALUES (
  'v5000000-0000-0000-0000-000000000003',
  'p5000000-0000-0000-0000-000000000003',
  'Slate Grey 750ml',
  'UK-TEST-LIFE-003',
  0, 0, 30, 5, '{"Capacity": "750ml"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  inventory_count = EXCLUDED.inventory_count;

-- Product 4: Pet Hair Remover Brush (Pet Accessories, £12.99, compare £16.99, SKU: UK-TEST-PET-004, stock: 25)
INSERT INTO public.products (
  id, slug, name, description, category_id, images,
  price_inr, compare_at_price_inr, price_gbp, compare_at_price_gbp,
  sku, status, is_featured, is_test_data, available_in_in, available_in_gb,
  supplier_name, shipping_info, seo_title, seo_description
)
VALUES (
  'p5000000-0000-0000-0000-000000000004',
  'pet-hair-remover-brush-uk-test',
  'Pet Hair Remover Brush',
  '[DEVELOPMENT TEST RECORD] Reusable multi-surface electrostatic pet hair and lint cleaning roller. Self-cleaning receptacle with quick-release disposal.',
  'c8000000-0000-0000-0000-000000000008',
  ARRAY['https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80'],
  1399.00, 1799.00, 12.99, 16.99,
  'UK-TEST-PET-004', 'active', FALSE, TRUE, FALSE, TRUE,
  'UK Dev Fixture (Manual Inventory)', 'Royal Mail Tracked 24/48 Dispatch',
  'Pet Hair Remover Brush (UK Test) — One Store',
  'Development test catalogue record for UK market.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_gbp = EXCLUDED.price_gbp,
  compare_at_price_gbp = EXCLUDED.compare_at_price_gbp,
  is_test_data = TRUE,
  available_in_in = FALSE,
  available_in_gb = TRUE;

INSERT INTO public.product_variants (
  id, product_id, name, sku, price_inr_adjustment, price_gbp_adjustment, inventory_count, low_stock_threshold, options
)
VALUES (
  'v5000000-0000-0000-0000-000000000004',
  'p5000000-0000-0000-0000-000000000004',
  'Standard Pro',
  'UK-TEST-PET-004',
  0, 0, 25, 5, '{"Model": "Standard Pro"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  inventory_count = EXCLUDED.inventory_count;

-- Product 5: Motion Sensor Night Light (Home Accessories, £14.99, compare £19.99, SKU: UK-TEST-HOME-005, stock: 20)
INSERT INTO public.products (
  id, slug, name, description, category_id, images,
  price_inr, compare_at_price_inr, price_gbp, compare_at_price_gbp,
  sku, status, is_featured, is_test_data, available_in_in, available_in_gb,
  supplier_name, shipping_info, seo_title, seo_description
)
VALUES (
  'p5000000-0000-0000-0000-000000000005',
  'motion-sensor-night-light-uk-test',
  'Motion Sensor Night Light',
  '[DEVELOPMENT TEST RECORD] Magnetic base rechargeable warm ambient night light with 120-degree PIR motion sensor, auto-off timer, and detachable portable wand.',
  'c9000000-0000-0000-0000-000000000009',
  ARRAY['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80'],
  1599.00, 2199.00, 14.99, 19.99,
  'UK-TEST-HOME-005', 'active', FALSE, TRUE, FALSE, TRUE,
  'UK Dev Fixture (Manual Inventory)', 'Royal Mail Tracked 24/48 Dispatch',
  'Motion Sensor Night Light (UK Test) — One Store',
  'Development test catalogue record for UK market.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_gbp = EXCLUDED.price_gbp,
  compare_at_price_gbp = EXCLUDED.compare_at_price_gbp,
  is_test_data = TRUE,
  available_in_in = FALSE,
  available_in_gb = TRUE;

INSERT INTO public.product_variants (
  id, product_id, name, sku, price_inr_adjustment, price_gbp_adjustment, inventory_count, low_stock_threshold, options
)
VALUES (
  'v5000000-0000-0000-0000-000000000005',
  'p5000000-0000-0000-0000-000000000005',
  'Warm Amber 2700K',
  'UK-TEST-HOME-005',
  0, 0, 20, 4, '{"Kelvin": "2700K"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  inventory_count = EXCLUDED.inventory_count;

-- Product 6: Car Cleaning Gel Kit (Car Accessories, £9.99, compare £12.99, SKU: UK-TEST-CAR-006, stock: 40)
INSERT INTO public.products (
  id, slug, name, description, category_id, images,
  price_inr, compare_at_price_inr, price_gbp, compare_at_price_gbp,
  sku, status, is_featured, is_test_data, available_in_in, available_in_gb,
  supplier_name, shipping_info, seo_title, seo_description
)
VALUES (
  'p5000000-0000-0000-0000-000000000006',
  'car-cleaning-gel-kit-uk-test',
  'Car Cleaning Gel Kit',
  '[DEVELOPMENT TEST RECORD] Reusable universal cleaning compound gel for dashboard vents, console seams, and gear selector recesses. Non-sticky residue-free formula.',
  'c1000000-0000-0000-0000-000000000010',
  ARRAY['https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80'],
  1099.00, 1399.00, 9.99, 12.99,
  'UK-TEST-CAR-006', 'active', FALSE, TRUE, FALSE, TRUE,
  'UK Dev Fixture (Manual Inventory)', 'Royal Mail Tracked 24/48 Dispatch',
  'Car Cleaning Gel Kit (UK Test) — One Store',
  'Development test catalogue record for UK market.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_gbp = EXCLUDED.price_gbp,
  compare_at_price_gbp = EXCLUDED.compare_at_price_gbp,
  is_test_data = TRUE,
  available_in_in = FALSE,
  available_in_gb = TRUE;

INSERT INTO public.product_variants (
  id, product_id, name, sku, price_inr_adjustment, price_gbp_adjustment, inventory_count, low_stock_threshold, options
)
VALUES (
  'v5000000-0000-0000-0000-000000000006',
  'p5000000-0000-0000-0000-000000000006',
  'Neon Blue 160g',
  'UK-TEST-CAR-006',
  0, 0, 40, 8, '{"Size": "160g"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  inventory_count = EXCLUDED.inventory_count;
