import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";

// GET /api/admin/products — List all products with variants & categories
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const market = searchParams.get("market"); // "IN" | "GB"
    const q = searchParams.get("q")?.toLowerCase();

    if (!isLiveSupabaseConfigured()) {
      let fallbackList = [...FALLBACK_PRODUCTS];
      if (status && status !== "all") {
        fallbackList = fallbackList.filter((p) => p.status === status);
      }
      if (market === "IN") {
        fallbackList = fallbackList.filter((p) => p.available_in_in !== false);
      } else if (market === "GB") {
        fallbackList = fallbackList.filter((p) => p.available_in_gb !== false);
      }
      if (q) {
        fallbackList = fallbackList.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ success: true, products: fallbackList, isFallback: true });
    }

    let query = supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (market === "IN") {
      query = query.eq("available_in_in", true);
    } else if (market === "GB") {
      query = query.eq("available_in_gb", true);
    }

    if (q) {
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, products: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching products";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/products — Create new product with variants and initial stock
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

    const body = await request.json();
    const {
      name,
      slug,
      sku,
      description,
      category_id,
      images,
      price_inr,
      compare_at_price_inr,
      price_gbp,
      compare_at_price_gbp,
      cost_price_inr,
      cost_price_gbp,
      supplier_name,
      available_in_in,
      available_in_gb,
      shipping_info,
      status,
      is_featured,
      seo_title,
      seo_description,
      variants,
    } = body;

    if (!name || !sku || price_inr === undefined || price_gbp === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: Name, SKU, Price INR, and Price GBP are mandatory." },
        { status: 400 }
      );
    }

    // Auto-generate clean slug if not provided
    const cleanSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    // 1. Insert product
    const { data: newProduct, error: prodError } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        sku: sku.trim().toUpperCase(),
        description: description?.trim() || "",
        category_id: category_id || null,
        images: Array.isArray(images) ? images : [],
        price_inr: Number(price_inr),
        compare_at_price_inr: compare_at_price_inr ? Number(compare_at_price_inr) : null,
        price_gbp: Number(price_gbp),
        compare_at_price_gbp: compare_at_price_gbp ? Number(compare_at_price_gbp) : null,
        cost_price_inr: cost_price_inr ? Number(cost_price_inr) : 0,
        cost_price_gbp: cost_price_gbp ? Number(cost_price_gbp) : 0,
        supplier_name: supplier_name?.trim() || null,
        available_in_in: available_in_in !== undefined ? !!available_in_in : true,
        available_in_gb: available_in_gb !== undefined ? !!available_in_gb : true,
        is_test_data: !!body.is_test_data,
        shipping_info: shipping_info?.trim() || null,
        status: status || "active",
        is_featured: !!is_featured,
        seo_title: seo_title?.trim() || `${name} — One Store`,
        seo_description: seo_description?.trim() || description?.slice(0, 160) || null,
      })
      .select()
      .single();

    if (prodError) {
      return NextResponse.json({ error: prodError.message }, { status: 400 });
    }

    // 2. Insert variants (or default variant)
    const variantList =
      Array.isArray(variants) && variants.length > 0
        ? variants
        : [
            {
              name: "Standard",
              sku: `${sku.trim().toUpperCase()}-STD`,
              price_inr_adjustment: 0,
              price_gbp_adjustment: 0,
              inventory_count: Number(body.initial_stock) || 10,
              low_stock_threshold: Number(body.low_stock_threshold) || 5,
              options: {},
            },
          ];

    const variantInserts = variantList.map((v) => ({
      product_id: newProduct.id,
      name: v.name || "Standard",
      sku: (v.sku || `${sku}-${v.name}`).toUpperCase(),
      price_inr_adjustment: Number(v.price_inr_adjustment) || 0,
      price_gbp_adjustment: Number(v.price_gbp_adjustment) || 0,
      cost_price_inr: Number(v.cost_price_inr) || Number(cost_price_inr) || 0,
      cost_price_gbp: Number(v.cost_price_gbp) || Number(cost_price_gbp) || 0,
      inventory_count: Number(v.inventory_count) || 0,
      low_stock_threshold: Number(v.low_stock_threshold) || 5,
      options: v.options || {},
    }));

    const { data: createdVariants, error: varError } = await supabase
      .from("product_variants")
      .insert(variantInserts)
      .select();

    if (varError) {
      // Return product even if variant insert hit an issue, but report warning
      return NextResponse.json({ success: true, product: newProduct, variantWarning: varError.message });
    }

    // 3. Log initial inventory movements
    try {
      if (createdVariants && createdVariants.length > 0) {
        const movements = createdVariants.map((v) => ({
          variant_id: v.id,
          change_amount: v.inventory_count,
          previous_count: 0,
          new_count: v.inventory_count,
          reason: "Initial product creation",
          performed_by: authResult.user?.email || "onestore.auth@gmail.com",
        }));
        await supabase.from("inventory_movements").insert(movements);
      }
    } catch {
      // Ignore if table not yet migrated
    }

    return NextResponse.json({
      success: true,
      product: {
        ...newProduct,
        variants: createdVariants || [],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
