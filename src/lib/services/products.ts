import { createPublicClient } from "@/lib/supabase/public";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import type { Product, ProductVariant, Category } from "@/lib/types/database";

// Fallback seed catalog matching development fixtures in supabase/seed.sql
export const FALLBACK_CATEGORIES: Category[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    slug: "audio-gear",
    name: "Precision Audio",
    description: "Studio-calibrated wireless acoustics and monitors engineered for sonic fidelity.",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c2000000-0000-0000-0000-000000000002",
    slug: "travel-carry",
    name: "Minimalist Carry",
    description: "Weatherproof engineered packs, modular organizers, and everyday carry essentials.",
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c3000000-0000-0000-0000-000000000003",
    slug: "timepieces",
    name: "Horology",
    description: "Contemporary mechanical, automatic & chronograph timepieces crafted in surgical steel.",
    image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c4000000-0000-0000-0000-000000000004",
    slug: "workspace",
    name: "Desk & Studio",
    description: "CNC-machined aluminum stands, wireless magnetic docks, and ergonomic work tools.",
    image_url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c5000000-0000-0000-0000-000000000005",
    slug: "electronics",
    name: "Electronics",
    description: "High-performance consumer electronics engineered for clarity and wireless mobility.",
    image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c6000000-0000-0000-0000-000000000006",
    slug: "home-office",
    name: "Home Office",
    description: "Ergonomic studio fixtures, illumination, and workspace productivity essentials.",
    image_url: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c7000000-0000-0000-0000-000000000007",
    slug: "home-and-lifestyle",
    name: "Home and Lifestyle",
    description: "Thermal drinkware and minimalist daily lifestyle essentials.",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c8000000-0000-0000-0000-000000000008",
    slug: "pet-accessories",
    name: "Pet Accessories",
    description: "Specialized pet care accessories and grooming solutions.",
    image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c9000000-0000-0000-0000-000000000009",
    slug: "home-accessories",
    name: "Home Accessories",
    description: "Motion-activated ambient fixtures and modern home convenience accessories.",
    image_url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c1000000-0000-0000-0000-000000000010",
    slug: "car-accessories",
    name: "Car Accessories",
    description: "Precision vehicle interior detailing kits and automotive maintenance tools.",
    image_url: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const FALLBACK_PRODUCTS: (Product & { variants: ProductVariant[]; category?: Category })[] = [
  {
    id: "p1000000-0000-0000-0000-000000000001",
    slug: "one-acoustic-pro-headphones",
    name: "One Acoustic Pro Wireless",
    description:
      "Custom-tuned 45mm neodymium drivers delivering immersive spatial resolution, hybrid ANC, memory foam cups, and 40-hour lossless playback.",
    category_id: "c1000000-0000-0000-0000-000000000001",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
    ],
    price_inr: 24999.0,
    compare_at_price_inr: 29999.0,
    price_gbp: 249.0,
    compare_at_price_gbp: 299.0,
    sku: "OAP-BLK-001",
    status: "active",
    is_featured: true,
    seo_title: "One Acoustic Pro Wireless Headphones — One Store",
    seo_description: "Premium spatial audio headphones with hybrid ANC and 40-hour battery life.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[0],
    variants: [
      {
        id: "v1000000-0000-0000-0000-000000000001",
        product_id: "p1000000-0000-0000-0000-000000000001",
        name: "Obsidian Black",
        sku: "OAP-BLK-001-A",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 24,
        low_stock_threshold: 5,
        options: { Color: "Obsidian Black" },
        created_at: new Date().toISOString(),
      },
      {
        id: "v1000000-0000-0000-0000-000000000002",
        product_id: "p1000000-0000-0000-0000-000000000001",
        name: "Arctic Silver",
        sku: "OAP-SLV-001-B",
        price_inr_adjustment: 1000.0,
        price_gbp_adjustment: 10.0,
        inventory_count: 8,
        low_stock_threshold: 5,
        options: { Color: "Arctic Silver" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p2000000-0000-0000-0000-000000000002",
    slug: "one-commuter-daypack-24l",
    name: "One Apex Modular Daypack 24L",
    description:
      "Cordura ballistic weave with magnetic Fidlock closures, waterproof YKK Aquaguard zips, dedicated 16-inch laptop compartment, and ergonomic suspended harness.",
    category_id: "c2000000-0000-0000-0000-000000000002",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80",
    ],
    price_inr: 14499.0,
    compare_at_price_inr: 17999.0,
    price_gbp: 145.0,
    compare_at_price_gbp: 175.0,
    sku: "OAD-GRY-002",
    status: "active",
    is_featured: true,
    seo_title: "One Apex Modular Daypack 24L — Weatherproof EDC Pack",
    seo_description: "Ballistic Cordura daypack with magnetic Fidlock hardware and waterproof storage.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[1],
    variants: [
      {
        id: "v2000000-0000-0000-0000-000000000001",
        product_id: "p2000000-0000-0000-0000-000000000002",
        name: "Graphite Grey",
        sku: "OAD-GRY-002-A",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 40,
        low_stock_threshold: 8,
        options: { Finish: "Graphite Grey" },
        created_at: new Date().toISOString(),
      },
      {
        id: "v2000000-0000-0000-0000-000000000002",
        product_id: "p2000000-0000-0000-0000-000000000002",
        name: "Stealth Black",
        sku: "OAD-BLK-002-B",
        price_inr_adjustment: 500.0,
        price_gbp_adjustment: 5.0,
        inventory_count: 3,
        low_stock_threshold: 5,
        options: { Finish: "Stealth Black" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p3000000-0000-0000-0000-000000000003",
    slug: "one-chronograph-phantom",
    name: "One Chronograph Phantom Noir",
    description:
      "Sapphire crystal glass, 316L surgical stainless steel casing, exhibition caseback, luminescent Super-LumiNova indices, and 100m water resistance.",
    category_id: "c3000000-0000-0000-0000-000000000003",
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    ],
    price_inr: 38999.0,
    compare_at_price_inr: 44999.0,
    price_gbp: 380.0,
    compare_at_price_gbp: 440.0,
    sku: "OCP-NOIR-003",
    status: "active",
    is_featured: true,
    seo_title: "One Chronograph Phantom Noir Timepiece",
    seo_description: "316L stainless steel chronograph with sapphire crystal and exhibition back.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[2],
    variants: [
      {
        id: "v3000000-0000-0000-0000-000000000001",
        product_id: "p3000000-0000-0000-0000-000000000003",
        name: "Matte Titanium Link",
        sku: "OCP-NOIR-003-A",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 12,
        low_stock_threshold: 3,
        options: { Strap: "Matte Titanium Link" },
        created_at: new Date().toISOString(),
      },
      {
        id: "v3000000-0000-0000-0000-000000000002",
        product_id: "p3000000-0000-0000-0000-000000000003",
        name: "Horween Leather Strap",
        sku: "OCP-LEA-003-B",
        price_inr_adjustment: -2000.0,
        price_gbp_adjustment: -20.0,
        inventory_count: 5,
        low_stock_threshold: 3,
        options: { Strap: "Horween Leather Strap" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p4000000-0000-0000-0000-000000000004",
    slug: "one-mag-dock-triple",
    name: "One MagDock 3-in-1 Studio Station",
    description:
      "Precision CNC anodized aluminum wireless hub delivering 15W MagSafe fast charging for phone, watch, and earbuds simultaneously with weighted anti-slip foundation.",
    category_id: "c4000000-0000-0000-0000-000000000004",
    images: ["https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=80"],
    price_inr: 8999.0,
    compare_at_price_inr: 10999.0,
    price_gbp: 89.0,
    compare_at_price_gbp: 110.0,
    sku: "OMD-ALU-004",
    status: "active",
    is_featured: false,
    seo_title: "One MagDock 3-in-1 Wireless Studio Station",
    seo_description: "CNC aluminum 3-in-1 wireless magnetic charging station for phone, watch and buds.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[3],
    variants: [
      {
        id: "v4000000-0000-0000-0000-000000000001",
        product_id: "p4000000-0000-0000-0000-000000000004",
        name: "Space Grey",
        sku: "OMD-GRY-004-A",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 50,
        low_stock_threshold: 10,
        options: { Color: "Space Grey" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p5000000-0000-0000-0000-000000000005",
    slug: "one-studio-mechanical-keyboard",
    name: "One Studio Wireless Mechanical Keyboard",
    description:
      "Gasket-mounted hot-swappable tactile switches, CNC aluminum top plate, RGB backlight, and tri-mode Bluetooth 5.2 / 2.4GHz wireless connectivity.",
    category_id: "c4000000-0000-0000-0000-000000000004",
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"],
    price_inr: 12999.0,
    compare_at_price_inr: 15499.0,
    price_gbp: 129.0,
    compare_at_price_gbp: 155.0,
    sku: "OSK-MEC-005",
    status: "active",
    is_featured: true,
    seo_title: "One Studio Wireless Mechanical Keyboard",
    seo_description: "Gasket-mounted mechanical keyboard with CNC aluminum frame and tri-mode wireless.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[3],
    variants: [
      {
        id: "v5000000-0000-0000-0000-000000000001",
        product_id: "p5000000-0000-0000-0000-000000000005",
        name: "Midnight Grey / Tactile Brown",
        sku: "OSK-MEC-005-A",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 35,
        low_stock_threshold: 5,
        options: { Switch: "Tactile Brown" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p6000000-0000-0000-0000-000000000006",
    slug: "one-spatial-earbuds-anc",
    name: "One Spatial True Wireless Earbuds ANC",
    description:
      "Dual balanced armature drivers, adaptive transparency mode, IPX5 sweat resistance, and wireless fast-charging pebble case.",
    category_id: "c1000000-0000-0000-0000-000000000001",
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80"],
    price_inr: 9999.0,
    compare_at_price_inr: 12999.0,
    price_gbp: 99.0,
    compare_at_price_gbp: 125.0,
    sku: "OSE-ANC-006",
    status: "active",
    is_featured: false,
    seo_title: "One Spatial True Wireless Earbuds with Hybrid ANC",
    seo_description: "Spatial audio wireless earbuds with 32-hour playback and IPX5 weatherproofing.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[0],
    variants: [
      {
        id: "v6000000-0000-0000-0000-000000000001",
        product_id: "p6000000-0000-0000-0000-000000000006",
        name: "Matte Black",
        sku: "OSE-ANC-006-A",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 45,
        low_stock_threshold: 10,
        options: { Color: "Matte Black" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p7000000-0000-0000-0000-000000000001",
    slug: "wireless-bluetooth-headphones-uk-test",
    name: "Wireless Bluetooth Headphones",
    description:
      "[DEVELOPMENT TEST RECORD] Over-ear acoustic wireless Bluetooth headphones with passive noise isolation, 40mm drivers, and 30-hour playback.",
    category_id: "c5000000-0000-0000-0000-000000000005",
    images: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80"],
    price_inr: 4299.0,
    compare_at_price_inr: 5499.0,
    price_gbp: 39.99,
    compare_at_price_gbp: 49.99,
    sku: "UK-TEST-AUD-001",
    status: "active",
    is_featured: true,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Wireless Bluetooth Headphones (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[4],
    variants: [
      {
        id: "v7000000-0000-0000-0000-000000000001",
        product_id: "p7000000-0000-0000-0000-000000000001",
        name: "Matte Black",
        sku: "UK-TEST-AUD-001",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 20,
        low_stock_threshold: 5,
        options: { Color: "Matte Black" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p7000000-0000-0000-0000-000000000002",
    slug: "adjustable-led-desk-lamp-uk-test",
    name: "Adjustable LED Desk Lamp",
    description:
      "[DEVELOPMENT TEST RECORD] Architectural articulated desk lamp with 5 colour temperature presets, touch stepless dimming, and integrated USB-A charging port.",
    category_id: "c6000000-0000-0000-0000-000000000006",
    images: ["https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=800&q=80"],
    price_inr: 2699.0,
    compare_at_price_inr: 3299.0,
    price_gbp: 24.99,
    compare_at_price_gbp: 29.99,
    sku: "UK-TEST-HOME-002",
    status: "active",
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Adjustable LED Desk Lamp (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[5],
    variants: [
      {
        id: "v7000000-0000-0000-0000-000000000002",
        product_id: "p7000000-0000-0000-0000-000000000002",
        name: "Anodized Silver",
        sku: "UK-TEST-HOME-002",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 15,
        low_stock_threshold: 4,
        options: { Finish: "Anodized Silver" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p7000000-0000-0000-0000-000000000003",
    slug: "reusable-insulated-water-bottle-uk-test",
    name: "Reusable Insulated Water Bottle",
    description:
      "[DEVELOPMENT TEST RECORD] Double-wall vacuum insulated 18/8 food-grade stainless steel bottle keeping liquids cold for 24h and hot for 12h. Leakproof seal.",
    category_id: "c7000000-0000-0000-0000-000000000007",
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80"],
    price_inr: 1799.0,
    compare_at_price_inr: 2299.0,
    price_gbp: 16.99,
    compare_at_price_gbp: 21.99,
    sku: "UK-TEST-LIFE-003",
    status: "active",
    is_featured: true,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Reusable Insulated Water Bottle (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[6],
    variants: [
      {
        id: "v7000000-0000-0000-0000-000000000003",
        product_id: "p7000000-0000-0000-0000-000000000003",
        name: "Slate Grey 750ml",
        sku: "UK-TEST-LIFE-003",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 30,
        low_stock_threshold: 5,
        options: { Capacity: "750ml" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p7000000-0000-0000-0000-000000000004",
    slug: "pet-hair-remover-brush-uk-test",
    name: "Pet Hair Remover Brush",
    description:
      "[DEVELOPMENT TEST RECORD] Reusable multi-surface electrostatic pet hair and lint cleaning roller. Self-cleaning receptacle with quick-release disposal.",
    category_id: "c8000000-0000-0000-0000-000000000008",
    images: ["https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80"],
    price_inr: 1399.0,
    compare_at_price_inr: 1799.0,
    price_gbp: 12.99,
    compare_at_price_gbp: 16.99,
    sku: "UK-TEST-PET-004",
    status: "active",
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Pet Hair Remover Brush (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[7],
    variants: [
      {
        id: "v7000000-0000-0000-0000-000000000004",
        product_id: "p7000000-0000-0000-0000-000000000004",
        name: "Standard Pro",
        sku: "UK-TEST-PET-004",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 25,
        low_stock_threshold: 5,
        options: { Model: "Standard Pro" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p7000000-0000-0000-0000-000000000005",
    slug: "motion-sensor-night-light-uk-test",
    name: "Motion Sensor Night Light",
    description:
      "[DEVELOPMENT TEST RECORD] Magnetic base rechargeable warm ambient night light with 120-degree PIR motion sensor, auto-off timer, and detachable portable wand.",
    category_id: "c9000000-0000-0000-0000-000000000009",
    images: ["https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80"],
    price_inr: 1599.0,
    compare_at_price_inr: 2199.0,
    price_gbp: 14.99,
    compare_at_price_gbp: 19.99,
    sku: "UK-TEST-HOME-005",
    status: "active",
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Motion Sensor Night Light (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[8],
    variants: [
      {
        id: "v7000000-0000-0000-0000-000000000005",
        product_id: "p7000000-0000-0000-0000-000000000005",
        name: "Warm Amber 2700K",
        sku: "UK-TEST-HOME-005",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 20,
        low_stock_threshold: 4,
        options: { Kelvin: "2700K" },
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "p7000000-0000-0000-0000-000000000006",
    slug: "car-cleaning-gel-kit-uk-test",
    name: "Car Cleaning Gel Kit",
    description:
      "[DEVELOPMENT TEST RECORD] Reusable universal cleaning compound gel for dashboard vents, console seams, and gear selector recesses. Non-sticky residue-free formula.",
    category_id: "c1000000-0000-0000-0000-000000000010",
    images: ["https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80"],
    price_inr: 1099.0,
    compare_at_price_inr: 1399.0,
    price_gbp: 9.99,
    compare_at_price_gbp: 12.99,
    sku: "UK-TEST-CAR-006",
    status: "active",
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Car Cleaning Gel Kit (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: FALLBACK_CATEGORIES[9],
    variants: [
      {
        id: "v7000000-0000-0000-0000-000000000006",
        product_id: "p7000000-0000-0000-0000-000000000006",
        name: "Neon Blue 160g",
        sku: "UK-TEST-CAR-006",
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: 40,
        low_stock_threshold: 8,
        options: { Size: "160g" },
        created_at: new Date().toISOString(),
      },
    ],
  },
];

export async function getProducts(options?: {
  categorySlug?: string;
  searchQuery?: string;
  featuredOnly?: boolean;
  market?: "IN" | "GB";
}) {
  let resolvedMarket = options?.market;
  if (!resolvedMarket && typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("one_store_market") as "IN" | "GB";
      if (saved === "IN" || saved === "GB") resolvedMarket = saved;
    } catch {
      // Ignore
    }
  }

  const effectiveOptions = { ...options, market: resolvedMarket };

  if (!isLiveSupabaseConfigured()) {
    return filterFallbackProducts(effectiveOptions);
  }

  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("status", "active");

    if (effectiveOptions.market === "IN") {
      query = query.eq("available_in_in", true);
    } else if (effectiveOptions.market === "GB") {
      query = query.eq("available_in_gb", true);
    }

    if (effectiveOptions.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return filterFallbackProducts(effectiveOptions);
    }

    let results = data;
    if (effectiveOptions.categorySlug) {
      results = results.filter((p) => p.category?.slug === effectiveOptions.categorySlug);
    }
    if (effectiveOptions.searchQuery) {
      const q = effectiveOptions.searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
      );
    }

    return results;
  } catch {
    return filterFallbackProducts(effectiveOptions);
  }
}

export async function getProductBySlug(slug: string) {
  if (!isLiveSupabaseConfigured()) {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !data) {
      return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
    }
    return data;
  } catch {
    return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
  }
}

export async function getCategories(market?: "IN" | "GB") {
  let categories: Category[] = FALLBACK_CATEGORIES;

  if (isLiveSupabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true);

      if (!error && data && data.length > 0) {
        categories = data;
      }
    } catch {
      // Fallback
    }
  }

  // If market is specified, filter categories that have active products in that market
  if (market) {
    const marketProducts = FALLBACK_PRODUCTS.filter((p) =>
      market === "IN" ? p.available_in_in !== false : p.available_in_gb !== false
    );
    const categoryIds = new Set(marketProducts.map((p) => p.category_id));
    return categories.filter((c) => categoryIds.has(c.id));
  }

  return categories;
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

function filterFallbackProducts(options?: {
  categorySlug?: string;
  searchQuery?: string;
  featuredOnly?: boolean;
  market?: "IN" | "GB";
}) {
  let list = [...FALLBACK_PRODUCTS];

  if (options?.market === "IN") {
    list = list.filter((p) => p.available_in_in !== false);
  } else if (options?.market === "GB") {
    list = list.filter((p) => p.available_in_gb !== false);
  }

  if (options?.featuredOnly) {
    list = list.filter((p) => p.is_featured);
  }

  if (options?.categorySlug) {
    list = list.filter((p) => p.category?.slug === options.categorySlug);
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category?.name.toLowerCase().includes(q)
    );
  }

  return list;
}
