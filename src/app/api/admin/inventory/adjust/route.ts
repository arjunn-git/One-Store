import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { updateAdminVariantStock } from "@/lib/services/admin-catalog-store";

// POST /api/admin/inventory/adjust — Adjust variant stock with audit reason
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const { variant_id, new_count, reason } = body;

    if (!variant_id || new_count === undefined || isNaN(Number(new_count))) {
      return NextResponse.json(
        { error: "Variant ID and a valid numerical new count are required." },
        { status: 400 }
      );
    }

    const nextCount = Math.max(0, parseInt(new_count, 10));
    const adjustmentReason = reason?.trim() || "Manual admin stock adjustment";
    const performerEmail = authResult.user?.email || "admin@onestore.com";

    if (!isLiveSupabaseConfigured()) {
      const res = updateAdminVariantStock(variant_id, nextCount, adjustmentReason, performerEmail);
      return NextResponse.json({
        success: true,
        variant_id,
        previous_count: res?.previousCount ?? 0,
        new_count: nextCount,
        change_amount: res?.changeAmount ?? 0,
        note: "Updated in preview/sandbox mode",
      });
    }

    const supabase = await createClient();

    try {
      // 1. Get current count
      const { data: currentVariant, error: fetchErr } = await supabase
        .from("product_variants")
        .select("inventory_count, sku")
        .eq("id", variant_id)
        .single();

      if (fetchErr || !currentVariant) {
        throw new Error(fetchErr?.message || "Variant not found.");
      }

      const previousCount = currentVariant.inventory_count ?? 0;
      const changeAmount = nextCount - previousCount;

      // 2. Update variant count
      const { error: updateErr } = await supabase
        .from("product_variants")
        .update({ inventory_count: nextCount })
        .eq("id", variant_id);

      if (updateErr) {
        throw updateErr;
      }

      // 3. Insert audit log in inventory_movements
      try {
        await supabase.from("inventory_movements").insert({
          variant_id,
          change_amount: changeAmount,
          previous_count: previousCount,
          new_count: nextCount,
          reason: adjustmentReason,
          performed_by: performerEmail,
        });
      } catch {
        // Ignore if movements table pending
      }

      return NextResponse.json({
        success: true,
        variant_id,
        previous_count: previousCount,
        new_count: nextCount,
        change_amount: changeAmount,
      });
    } catch (dbErr: unknown) {
      console.warn("Live inventory adjust failed, falling back to local catalog store:", dbErr);
      const res = updateAdminVariantStock(variant_id, nextCount, adjustmentReason, performerEmail);
      if (res) {
        return NextResponse.json({
          success: true,
          variant_id,
          previous_count: res.previousCount,
          new_count: res.newCount,
          change_amount: res.changeAmount,
          isFallback: true,
        });
      }
      const msg = dbErr instanceof Error ? dbErr.message : "Error adjusting inventory";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error adjusting inventory";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
