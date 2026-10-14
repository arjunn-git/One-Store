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
    image_url: "/placeholder-audio.jpg",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c2000000-0000-0000-0000-000000000002",
    slug: "travel-carry",
    name: "Minimalist Carry",
    description: "Weatherproof engineered packs, modular organizers, and everyday carry essentials.",
    image_url: "/placeholder-carry.jpg",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c3000000-0000-0000-0000-000000000003",
    slug: "timepieces",
    name: "Horology",
    description: "Contemporary mechanical, automatic & chronograph timepieces crafted in surgical steel.",
    image_url: "/placeholder-watch.jpg",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "c4000000-0000-0000-0000-000000000004",
    slug: "workspace",
    name: "Desk & Studio",
    description: "CNC-machined aluminum stands, wireless magnetic docks, and ergonomic work tools.",
    image_url: "/placeholder-desk.jpg",
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
    images: ["/placeholder-product-1.jpg"],
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
    images: ["/placeholder-product-2.jpg"],
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
        inventory_count: 3, // Low stock demo
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
    images: ["/placeholder-product-3.jpg"],
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
        inventory_count: 0, // Out of stock demo
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
    images: ["/placeholder-product-4.jpg"],
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
];

export async function getProducts(options?: {
  categorySlug?: string;
  searchQuery?: string;
  featuredOnly?: boolean;
}) {
  if (!isLiveSupabaseConfigured()) {
    return filterFallbackProducts(options);
  }

  try {
    const supabase = createPublicClient();
    let query = supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("status", "active");

    if (options?.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return filterFallbackProducts(options);
    }
    return data;
  } catch {
    return filterFallbackProducts(options);
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

export async function getCategories() {
  if (!isLiveSupabaseConfigured()) {
    return FALLBACK_CATEGORIES;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      return FALLBACK_CATEGORIES;
    }
    return data;
  } catch {
    return FALLBACK_CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string) {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) || null;
}

function filterFallbackProducts(options?: {
  categorySlug?: string;
  searchQuery?: string;
  featuredOnly?: boolean;
}) {
  let list = [...FALLBACK_PRODUCTS];

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
