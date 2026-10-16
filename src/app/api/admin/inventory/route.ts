import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";

// GET /api/admin/inventory — Fetch variants across all products with stock and movements
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const q = searchParams.get("q")?.toLowerCase();

    if (!isLiveSupabaseConfigured()) {
      // Map fallback products to inventory items
      const items = FALLBACK_PRODUCTS.flatMap((p) =>
        p.variants.map((v) => ({
          id: v.id,
          product_id: p.id,
          product_name: p.name,
          product_sku: p.sku,
          variant_name: v.name,
          sku: v.sku,
          inventory_count: v.inventory_count,
          low_stock_threshold: v.low_stock_threshold,
          is_low_stock: v.inventory_count <= v.low_stock_threshold,
          options: v.options,
          image: p.images?.[0] || null,
        }))
      );

      let filtered = items;
      if (lowStockOnly) {
        filtered = filtered.filter((i) => i.is_low_stock);
      }
      if (q) {
        filtered = filtered.filter(
          (i) =>
            i.product_name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.variant_name.toLowerCase().includes(q)
        );
      }

      return NextResponse.json({
        success: true,
        items: filtered,
        movements: [
          {
            id: "m-001",
            variant_sku: "OAP-BLK-001-A",
            change_amount: 24,
            reason: "Initial baseline stock intake",
            performed_by: "admin@onestore.com",
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: "m-002",
            variant_sku: "OAD-BLK-002-B",
            change_amount: -2,
            reason: "Order dispatch allocation",
            performed_by: "system",
            created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          },
        ],
        isFallback: true,
      });
    }

    // Live Supabase query
    const { data: variants, error: varError } = await supabase
      .from("product_variants")
      .select("*, product:products(id, name, sku, images, status)")
      .order("created_at", { ascending: false });

    if (varError) {
      return NextResponse.json({ error: varError.message }, { status: 400 });
    }

    const items = (variants || []).map((v) => {
      const product = Array.isArray(v.product) ? v.product[0] : v.product;
      const invCount = v.inventory_count ?? 0;
      const threshold = v.low_stock_threshold ?? 5;
      return {
        id: v.id,
        product_id: product?.id || v.product_id,
        product_name: product?.name || "Unknown Product",
        product_sku: product?.sku || "N/A",
        variant_name: v.name,
        sku: v.sku,
        inventory_count: invCount,
        reserved_count: v.reserved_count ?? 0,
        low_stock_threshold: threshold,
        is_low_stock: invCount <= threshold,
        options: v.options || {},
        image: product?.images?.[0] || null,
        status: product?.status || "active",
      };
    });

    let filtered = items;
    if (lowStockOnly) {
      filtered = filtered.filter((i) => i.is_low_stock);
    }
    if (q) {
      filtered = filtered.filter(
        (i) =>
          i.product_name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.variant_name.toLowerCase().includes(q)
      );
    }

    // Also fetch recent inventory movements
    let movements: unknown[] = [];
    try {
      const { data: moveData } = await supabase
        .from("inventory_movements")
        .select("*, variant:product_variants(sku, name)")
        .order("created_at", { ascending: false })
        .limit(30);
      movements = moveData || [];
    } catch {
      // Table might not exist yet if migration pending
    }

    return NextResponse.json({ success: true, items: filtered, movements });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching inventory";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
