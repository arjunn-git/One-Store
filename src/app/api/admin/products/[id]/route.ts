import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import {
  getAdminProductsStore,
  saveAdminProduct,
  deleteAdminProduct,
} from "@/lib/services/admin-catalog-store";

// GET /api/admin/products/[id]
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await context.params;

    if (!isLiveSupabaseConfigured()) {
      const fallback = getAdminProductsStore().find((p) => p.id === id);
      if (!fallback) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ success: true, product: fallback });
    }

    const supabase = await createClient();

    try {
      const { data: product, error } = await supabase
        .from("products")
        .select("*, category:categories(*), variants:product_variants(*)")
        .eq("id", id)
        .single();

      if (error || !product) {
        throw error || new Error("Product not found");
      }

      return NextResponse.json({ success: true, product });
    } catch (dbErr: unknown) {
      console.warn("Live product fetch failed, falling back to local catalog store:", dbErr);
      const fallback = getAdminProductsStore().find((p) => p.id === id);
      if (!fallback) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ success: true, product: fallback, isFallback: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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

    const updateLocalProduct = () => {
      const current = getAdminProductsStore().find((p) => p.id === id);
      if (!current) {
        return null;
      }
      const updated = {
        ...current,
        name: name !== undefined ? name.trim() : current.name,
        slug: slug !== undefined ? slug.trim() : current.slug,
        sku: sku !== undefined ? sku.trim().toUpperCase() : current.sku,
        description: description !== undefined ? description.trim() : current.description,
        category_id: category_id !== undefined ? category_id : current.category_id,
        images: Array.isArray(images) ? images : current.images,
        price_inr: price_inr !== undefined ? Number(price_inr) : current.price_inr,
        compare_at_price_inr: compare_at_price_inr ? Number(compare_at_price_inr) : current.compare_at_price_inr,
        price_gbp: price_gbp !== undefined ? Number(price_gbp) : current.price_gbp,
        compare_at_price_gbp: compare_at_price_gbp ? Number(compare_at_price_gbp) : current.compare_at_price_gbp,
        cost_price_inr: cost_price_inr !== undefined ? Number(cost_price_inr) : current.cost_price_inr,
        cost_price_gbp: cost_price_gbp !== undefined ? Number(cost_price_gbp) : current.cost_price_gbp,
        supplier_name: supplier_name !== undefined ? supplier_name?.trim() : current.supplier_name,
        available_in_in: available_in_in !== undefined ? !!available_in_in : current.available_in_in,
        available_in_gb: available_in_gb !== undefined ? !!available_in_gb : current.available_in_gb,
        is_test_data: body.is_test_data !== undefined ? !!body.is_test_data : current.is_test_data,
        shipping_info: shipping_info !== undefined ? shipping_info?.trim() : current.shipping_info,
        status: status !== undefined ? status : current.status,
        is_featured: is_featured !== undefined ? !!is_featured : current.is_featured,
        seo_title: seo_title !== undefined ? seo_title?.trim() : current.seo_title,
        seo_description: seo_description !== undefined ? seo_description?.trim() : current.seo_description,
        updated_at: new Date().toISOString(),
        variants: Array.isArray(variants) ? variants : current.variants,
      };
      saveAdminProduct(updated);
      return updated;
    };

    if (!isLiveSupabaseConfigured()) {
      const updated = updateLocalProduct();
      if (!updated) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ success: true, product: updated });
    }

    const supabase = await createClient();

    try {
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
        throw prodError;
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
    } catch (dbErr: unknown) {
      console.warn("Live product update failed, falling back to local catalog store:", dbErr);
      const updated = updateLocalProduct();
      if (!updated) {
        const msg = dbErr instanceof Error ? dbErr.message : "Error updating product";
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      return NextResponse.json({ success: true, product: updated, isFallback: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — Soft archive or hard delete
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (!isLiveSupabaseConfigured()) {
      if (hardDelete) {
        deleteAdminProduct(id);
      } else {
        const p = getAdminProductsStore().find((item) => item.id === id);
        if (p) p.status = "archived";
      }
      return NextResponse.json({ success: true, id });
    }

    const supabase = await createClient();

    try {
      if (hardDelete) {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
      } else {
        // Archive by default
        const { error } = await supabase
          .from("products")
          .update({ status: "archived", updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }

      return NextResponse.json({ success: true, id });
    } catch (dbErr: unknown) {
      console.warn("Live product delete failed, falling back to local catalog store:", dbErr);
      if (hardDelete) {
        deleteAdminProduct(id);
      } else {
        const p = getAdminProductsStore().find((item) => item.id === id);
        if (p) p.status = "archived";
      }
      return NextResponse.json({ success: true, id, isFallback: true });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
