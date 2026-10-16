import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { getAdminProductsStore, saveAdminProduct } from "@/lib/services/admin-catalog-store";
import type { Product, ProductVariant, Category } from "@/lib/types/database";

// GET /api/admin/products — List all products with variants & categories
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const market = searchParams.get("market"); // "IN" | "GB"
    const q = searchParams.get("q")?.toLowerCase();

    let data: any[] | null = null;

    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
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

        const res = await query;
        if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
          data = res.data;
        }
      } catch {
        // Fallback to in-memory catalog store
      }
    }

    if (!data) {
      let fallbackList = getAdminProductsStore();
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

    return NextResponse.json({ success: true, products: data });
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

    const cleanSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const newProductId = `prod_${Date.now()}`;
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

    const preparedVariants: ProductVariant[] = variantList.map((v, idx) => ({
      id: `var_${Date.now()}_${idx}`,
      product_id: newProductId,
      name: v.name || "Standard",
      sku: (v.sku || `${sku}-${v.name || idx}`).toUpperCase(),
      price_inr_adjustment: Number(v.price_inr_adjustment) || 0,
      price_gbp_adjustment: Number(v.price_gbp_adjustment) || 0,
      cost_price_inr: Number(v.cost_price_inr) || Number(cost_price_inr) || 0,
      cost_price_gbp: Number(v.cost_price_gbp) || Number(cost_price_gbp) || 0,
      inventory_count: Number(v.inventory_count) || 0,
      low_stock_threshold: Number(v.low_stock_threshold) || 5,
      options: v.options || {},
      created_at: new Date().toISOString(),
    }));

    const inMemoryProduct: Product & { variants: ProductVariant[]; category?: Category } = {
      id: newProductId,
      name: name.trim(),
      slug: cleanSlug,
      sku: sku.trim().toUpperCase(),
      description: description?.trim() || "",
      category_id: category_id || null,
      images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"],
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      variants: preparedVariants,
    };

    if (isLiveSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: createdDbProduct, error: prodError } = await supabase
          .from("products")
          .insert({
            name: inMemoryProduct.name,
            slug: inMemoryProduct.slug,
            sku: inMemoryProduct.sku,
            description: inMemoryProduct.description,
            category_id: inMemoryProduct.category_id,
            images: inMemoryProduct.images,
            price_inr: inMemoryProduct.price_inr,
            compare_at_price_inr: inMemoryProduct.compare_at_price_inr,
            price_gbp: inMemoryProduct.price_gbp,
            compare_at_price_gbp: inMemoryProduct.compare_at_price_gbp,
            cost_price_inr: inMemoryProduct.cost_price_inr,
            cost_price_gbp: inMemoryProduct.cost_price_gbp,
            supplier_name: inMemoryProduct.supplier_name,
            available_in_in: inMemoryProduct.available_in_in,
            available_in_gb: inMemoryProduct.available_in_gb,
            is_test_data: inMemoryProduct.is_test_data,
            shipping_info: inMemoryProduct.shipping_info,
            status: inMemoryProduct.status,
            is_featured: inMemoryProduct.is_featured,
            seo_title: inMemoryProduct.seo_title,
            seo_description: inMemoryProduct.seo_description,
          })
          .select()
          .single();

        if (!prodError && createdDbProduct) {
          const variantInserts = preparedVariants.map((v) => ({
            product_id: createdDbProduct.id,
            name: v.name,
            sku: v.sku,
            price_inr_adjustment: v.price_inr_adjustment,
            price_gbp_adjustment: v.price_gbp_adjustment,
            cost_price_inr: v.cost_price_inr,
            cost_price_gbp: v.cost_price_gbp,
            inventory_count: v.inventory_count,
            low_stock_threshold: v.low_stock_threshold,
            options: v.options,
          }));

          const { data: dbVariants } = await supabase
            .from("product_variants")
            .insert(variantInserts)
            .select();

          return NextResponse.json({
            success: true,
            product: {
              ...createdDbProduct,
              variants: dbVariants || [],
            },
          });
        }
      } catch {
        // Fallback to in-memory save below
      }
    }

    // Save to fallback catalog store so admin can continue working uninterrupted
    const saved = saveAdminProduct(inMemoryProduct);
    return NextResponse.json({
      success: true,
      product: saved,
      isFallback: true,
      note: "Saved to local catalog registry.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating product";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
