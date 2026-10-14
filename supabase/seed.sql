-- ==============================================================================
-- ONE STORE: Development Seed Data (For testing & local development only)
-- DO NOT USE AS LIVE PRODUCTION DATA
-- ==============================================================================

-- Clear existing dev fixtures
DELETE FROM public.promo_codes WHERE code IN ('LAUNCH10', 'WELCOME50');
DELETE FROM public.categories WHERE slug IN ('audio-gear', 'travel-carry', 'timepieces');

-- Categories
INSERT INTO public.categories (id, slug, name, description, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'audio-gear', 'Precision Audio', 'Studio-calibrated wireless acoustics and monitors.', TRUE),
  ('c2000000-0000-0000-0000-000000000002', 'travel-carry', 'Minimalist Carry', 'Weatherproof engineered packs and everyday carry.', TRUE),
  ('c3000000-0000-0000-0000-000000000003', 'timepieces', 'Horology', 'Contemporary mechanical & chronograph timepieces.', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO public.products (id, slug, name, description, category_id, images, price_inr, compare_at_price_inr, price_gbp, compare_at_price_gbp, sku, status, is_featured)
VALUES
  (
    'p1000000-0000-0000-0000-000000000001',
    'one-acoustic-pro-headphones',
    'One Acoustic Pro Wireless',
    'Custom-tuned 45mm neodymium drivers delivering immersive spatial resolution, hybrid ANC, and 40-hour lossless playback.',
    'c1000000-0000-0000-0000-000000000001',
    ARRAY['/placeholder-product-1.jpg'],
    24999.00,
    29999.00,
    249.00,
    299.00,
    'OAP-BLK-001',
    'active',
    TRUE
  ),
  (
    'p2000000-0000-0000-0000-000000000002',
    'one-commuter-daypack-24l',
    'One Apex Modular Daypack 24L',
    'Cordura ballistic weave with magnetic Fidlock closures, waterproof YKK Aquaguard zips, and ergonomic suspended harness.',
    'c2000000-0000-0000-0000-000000000002',
    ARRAY['/placeholder-product-2.jpg'],
    14499.00,
    17999.00,
    145.00,
    175.00,
    'OAD-GRY-002',
    'active',
    TRUE
  ),
  (
    'p3000000-0000-0000-0000-000000000003',
    'one-chronograph-phantom',
    'One Chronograph Phantom Noir',
    'Sapphire crystal glass, 316L surgical stainless casing, exhibition caseback, and 100m water resistance.',
    'c3000000-0000-0000-0000-000000000003',
    ARRAY['/placeholder-product-3.jpg'],
    38999.00,
    44999.00,
    380.00,
    440.00,
    'OCP-NOIR-003',
    'active',
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;

-- Variants & Inventory
INSERT INTO public.product_variants (product_id, name, sku, price_inr_adjustment, price_gbp_adjustment, inventory_count, low_stock_threshold)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'Obsidian Black', 'OAP-BLK-001-A', 0.00, 0.00, 25, 5),
  ('p1000000-0000-0000-0000-000000000001', 'Arctic Silver', 'OAP-SLV-001-B', 1000.00, 10.00, 18, 5),
  ('p2000000-0000-0000-0000-000000000002', 'Graphite Grey', 'OAD-GRY-002-A', 0.00, 0.00, 40, 8),
  ('p3000000-0000-0000-0000-000000000003', 'Matte Titanium', 'OCP-NOIR-003-A', 0.00, 0.00, 12, 3)
ON CONFLICT (sku) DO NOTHING;

-- Sample Promotional Codes
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, min_spend, max_uses, per_customer_limit, is_active)
VALUES
  ('LAUNCH10', '10% off launch celebration discount', 'percentage', 10.00, 2000.00, 500, 1, TRUE),
  ('WELCOME50', 'Flat £50 or ₹5,000 off orders over threshold', 'fixed', 5000.00, 20000.00, 200, 1, TRUE)
ON CONFLICT (code) DO NOTHING;
