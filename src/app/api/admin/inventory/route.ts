import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { getAdminProductsStore, getInventoryMovementsStore } from "@/lib/services/admin-catalog-store";

// GET /api/admin/inventory — Fetch variants across all products with stock and movements
export async function GET(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const q = searchParams.get("q")?.toLowerCase();

    const getLocalInventoryResponse = () => {
      const storeProducts = getAdminProductsStore();
      const items = storeProducts.flatMap((p) =>
        (p.variants || []).map((v) => ({
          id: v.id,
          product_id: p.id,
          product_name: p.name,
          product_sku: p.sku,
          variant_name: v.name,
          sku: v.sku,
          inventory_count: v.inventory_count,
          low_stock_threshold: v.low_stock_threshold ?? 5,
          is_low_stock: (v.inventory_count ?? 0) <= (v.low_stock_threshold ?? 5),
          options: v.options || {},
          image: p.images?.[0] || null,
          status: p.status || "active",
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
        movements: getInventoryMovementsStore(),
        isFallback: true,
      });
    };

    if (!isLiveSupabaseConfigured()) {
      return getLocalInventoryResponse();
    }

    // Live Supabase query
    const supabase = await createClient();
    try {
      const { data: variants, error: varError } = await supabase
        .from("product_variants")
        .select("*, product:products(id, name, sku, images, status)")
        .order("created_at", { ascending: false });

      if (varError) {
        console.warn("product_variants query failed, falling back to local catalog store:", varError.message);
        return getLocalInventoryResponse();
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
        movements = getInventoryMovementsStore();
      }

      return NextResponse.json({ success: true, items: filtered, movements });
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.warn("Live inventory query error, falling back to local store:", msg);
      return getLocalInventoryResponse();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching inventory";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
