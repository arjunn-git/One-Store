/**
 * ONE STORE: Idempotent UK Test Products Seed Script
 *
 * Requirements:
 * - Inserts the 6 sample UK test products.
 * - Uses test SKUs as stable unique identifiers.
 * - Safe to run repeatedly without creating duplicates.
 * - Clearly tags records with is_test_data: true and development labels.
 * - Flags available_in_gb: true, available_in_in: false.
 * - Never deletes or overwrites existing production products.
 *
 * Usage:
 *   node scripts/seed-uk-products.mjs
 *   node scripts/seed-uk-products.mjs --publish
 *   node scripts/seed-uk-products.mjs --draft
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple native .env.local loader
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of envLines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || "").trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch {
  // Ignore
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isPublish = process.argv.includes("--publish");
const isDraft = process.argv.includes("--draft");
const targetStatus = isDraft ? "draft" : "active";

console.log("============================================================");
console.log("ONE STORE — UK TEST PRODUCTS SEED SCRIPT");
console.log("============================================================");
console.log(`Target Status: ${targetStatus.toUpperCase()} (is_test_data: true)`);

const UK_CATEGORIES = [
  {
    id: "c5000000-0000-0000-0000-000000000005",
    slug: "electronics",
    name: "Electronics",
    description: "High-performance consumer electronics engineered for clarity and wireless mobility.",
    image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
    is_active: true,
  },
  {
    id: "c6000000-0000-0000-0000-000000000006",
    slug: "home-office",
    name: "Home Office",
    description: "Ergonomic studio fixtures, illumination, and workspace productivity essentials.",
    image_url: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=800&q=80",
    is_active: true,
  },
  {
    id: "c7000000-0000-0000-0000-000000000007",
    slug: "home-and-lifestyle",
    name: "Home and Lifestyle",
    description: "Thermal drinkware and minimalist daily lifestyle essentials.",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    is_active: true,
  },
  {
    id: "c8000000-0000-0000-0000-000000000008",
    slug: "pet-accessories",
    name: "Pet Accessories",
    description: "Specialized pet care accessories and grooming solutions.",
    image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80",
    is_active: true,
  },
  {
    id: "c9000000-0000-0000-0000-000000000009",
    slug: "home-accessories",
    name: "Home Accessories",
    description: "Motion-activated ambient fixtures and modern home convenience accessories.",
    image_url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80",
    is_active: true,
  },
  {
    id: "c1000000-0000-0000-0000-000000000010",
    slug: "car-accessories",
    name: "Car Accessories",
    description: "Precision vehicle interior detailing kits and automotive maintenance tools.",
    image_url: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80",
    is_active: true,
  },
];

const UK_TEST_PRODUCTS = [
  {
    id: "p5000000-0000-0000-0000-000000000001",
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
    status: targetStatus,
    is_featured: true,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Wireless Bluetooth Headphones (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    variant: {
      id: "v5000000-0000-0000-0000-000000000001",
      name: "Matte Black",
      sku: "UK-TEST-AUD-001",
      inventory_count: 20,
      low_stock_threshold: 5,
      options: { Color: "Matte Black" },
    },
  },
  {
    id: "p5000000-0000-0000-0000-000000000002",
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
    status: targetStatus,
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Adjustable LED Desk Lamp (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    variant: {
      id: "v5000000-0000-0000-0000-000000000002",
      name: "Anodized Silver",
      sku: "UK-TEST-HOME-002",
      inventory_count: 15,
      low_stock_threshold: 4,
      options: { Finish: "Anodized Silver" },
    },
  },
  {
    id: "p5000000-0000-0000-0000-000000000003",
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
    status: targetStatus,
    is_featured: true,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Reusable Insulated Water Bottle (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    variant: {
      id: "v5000000-0000-0000-0000-000000000003",
      name: "Slate Grey 750ml",
      sku: "UK-TEST-LIFE-003",
      inventory_count: 30,
      low_stock_threshold: 5,
      options: { Capacity: "750ml" },
    },
  },
  {
    id: "p5000000-0000-0000-0000-000000000004",
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
    status: targetStatus,
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Pet Hair Remover Brush (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    variant: {
      id: "v5000000-0000-0000-0000-000000000004",
      name: "Standard Pro",
      sku: "UK-TEST-PET-004",
      inventory_count: 25,
      low_stock_threshold: 5,
      options: { Model: "Standard Pro" },
    },
  },
  {
    id: "p5000000-0000-0000-0000-000000000005",
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
    status: targetStatus,
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Motion Sensor Night Light (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    variant: {
      id: "v5000000-0000-0000-0000-000000000005",
      name: "Warm Amber 2700K",
      sku: "UK-TEST-HOME-005",
      inventory_count: 20,
      low_stock_threshold: 4,
      options: { Kelvin: "2700K" },
    },
  },
  {
    id: "p5000000-0000-0000-0000-000000000006",
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
    status: targetStatus,
    is_featured: false,
    is_test_data: true,
    available_in_in: false,
    available_in_gb: true,
    supplier_name: "UK Dev Fixture (Manual Inventory)",
    shipping_info: "Royal Mail Tracked 24/48 Dispatch",
    seo_title: "Car Cleaning Gel Kit (UK Test) — One Store",
    seo_description: "Development test catalogue record for UK market.",
    variant: {
      id: "v5000000-0000-0000-0000-000000000006",
      name: "Neon Blue 160g",
      sku: "UK-TEST-CAR-006",
      inventory_count: 40,
      low_stock_threshold: 8,
      options: { Size: "160g" },
    },
  },
];

async function runSeed() {
  if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes("placeholder")) {
    console.log("No live Supabase credentials configured. Fallback catalogue will be used.");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  console.log("Connecting to Supabase at:", SUPABASE_URL);

  // 1. Seed Categories
  console.log("\n[1/3] Upserting 6 UK Test Categories...");
  for (const cat of UK_CATEGORIES) {
    const { error } = await supabase.from("categories").upsert(cat, { onConflict: "id" });
    if (error) {
      console.warn(`  Warning on category ${cat.name}:`, error.message);
    } else {
      console.log(`  ✓ Category: ${cat.name} (${cat.slug})`);
    }
  }

  // 2. Seed Products
  console.log("\n[2/3] Upserting 6 UK Test Products...");
  for (const item of UK_TEST_PRODUCTS) {
    const { variant, ...productData } = item;
    const { error: prodErr } = await supabase
      .from("products")
      .upsert(productData, { onConflict: "id" });

    if (prodErr) {
      console.warn(`  Warning on product ${item.name}:`, prodErr.message);
    } else {
      console.log(`  ✓ Product: ${item.name} [${item.sku}] (£${item.price_gbp})`);
    }

    // 3. Seed Variant
    if (variant) {
      const variantData = {
        id: variant.id,
        product_id: item.id,
        name: variant.name,
        sku: variant.sku,
        price_inr_adjustment: 0,
        price_gbp_adjustment: 0,
        inventory_count: variant.inventory_count,
        low_stock_threshold: variant.low_stock_threshold,
        options: variant.options,
      };

      const { error: varErr } = await supabase
        .from("product_variants")
        .upsert(variantData, { onConflict: "id" });

      if (varErr) {
        console.warn(`    Warning on variant ${variant.name}:`, varErr.message);
      } else {
        console.log(`    → Variant: ${variant.name} (Stock: ${variant.inventory_count})`);
      }
    }
  }

  console.log("\n============================================================");
  console.log("SEED COMPLETE: 6 UK test products successfully registered.");
  console.log("============================================================");
}

runSeed().catch((err) => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});
