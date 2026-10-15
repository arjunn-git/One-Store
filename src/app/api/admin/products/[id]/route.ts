import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";

// GET /api/admin/products/[id]
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    if (!isLiveSupabaseConfigured()) {
      const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id);
      if (!fallback) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ success: true, product: fallback });
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("*, category:categories(*), variants:product_variants(*)")
      .eq("id", id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
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

    // 1. Update product
    const { data: updatedProduct, error: prodError } = await supabase
      .from("products")
      .update({
        name: name !== undefined ? name.trim() : undefined,
        slug: slug !== undefined ? slug.trim() : undefined,
        sku: sku !== undefined ? sku.trim().toUpperCase() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        category_id: category_id !== undefined ? category_id : undefined,
        images: Array.isArray(images) ? images : undefined,
        price_inr: price_inr !== undefined ? Number(price_inr) : undefined,
        compare_at_price_inr: compare_at_price_inr ? Number(compare_at_price_inr) : null,
        price_gbp: price_gbp !== undefined ? Number(price_gbp) : undefined,
        compare_at_price_gbp: compare_at_price_gbp ? Number(compare_at_price_gbp) : null,
        cost_price_inr: cost_price_inr !== undefined ? Number(cost_price_inr) : undefined,
        cost_price_gbp: cost_price_gbp !== undefined ? Number(cost_price_gbp) : undefined,
        supplier_name: supplier_name !== undefined ? supplier_name?.trim() : undefined,
        available_in_in: available_in_in !== undefined ? !!available_in_in : undefined,
        available_in_gb: available_in_gb !== undefined ? !!available_in_gb : undefined,
        is_test_data: body.is_test_data !== undefined ? !!body.is_test_data : undefined,
        shipping_info: shipping_info !== undefined ? shipping_info?.trim() : undefined,
        status: status !== undefined ? status : undefined,
        is_featured: is_featured !== undefined ? !!is_featured : undefined,
        seo_title: seo_title !== undefined ? seo_title?.trim() : undefined,
        seo_description: seo_description !== undefined ? seo_description?.trim() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (prodError) {
      return NextResponse.json({ error: prodError.message }, { status: 400 });
    }

    // 2. Update or insert variants if provided
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          // Existing variant update
          await supabase
            .from("product_variants")
            .update({
              name: v.name,
              sku: v.sku?.toUpperCase(),
              price_inr_adjustment: Number(v.price_inr_adjustment) || 0,
              price_gbp_adjustment: Number(v.price_gbp_adjustment) || 0,
              cost_price_inr: Number(v.cost_price_inr) || 0,
              cost_price_gbp: Number(v.cost_price_gbp) || 0,
              inventory_count: v.inventory_count !== undefined ? Number(v.inventory_count) : undefined,
              low_stock_threshold: Number(v.low_stock_threshold) || 5,
              options: v.options || {},
            })
            .eq("id", v.id);
        } else {
          // New variant insert
          await supabase.from("product_variants").insert({
            product_id: id,
            name: v.name || "Standard",
            sku: (v.sku || `${sku}-${Date.now()}`).toUpperCase(),
            price_inr_adjustment: Number(v.price_inr_adjustment) || 0,
            price_gbp_adjustment: Number(v.price_gbp_adjustment) || 0,
            cost_price_inr: Number(v.cost_price_inr) || 0,
            cost_price_gbp: Number(v.cost_price_gbp) || 0,
            inventory_count: Number(v.inventory_count) || 0,
            low_stock_threshold: Number(v.low_stock_threshold) || 5,
            options: v.options || {},
          });
        }
      }
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — Soft archive or hard delete
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (hardDelete) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      // Archive by default
      const { error } = await supabase
        .from("products")
        .update({ status: "archived", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
