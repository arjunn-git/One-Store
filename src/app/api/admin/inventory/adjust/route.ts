import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLiveSupabaseConfigured } from "@/lib/services/auth";
import { verifyAdminRequest } from "@/lib/services/admin-auth";

// POST /api/admin/inventory/adjust — Adjust variant stock with audit reason
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const supabase = await createClient();

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

    if (!isLiveSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        variant_id,
        new_count: nextCount,
        note: "Updated in preview/sandbox mode",
      });
    }

    // 1. Get current count
    const { data: currentVariant, error: fetchErr } = await supabase
      .from("product_variants")
      .select("inventory_count, sku")
      .eq("id", variant_id)
      .single();

    if (fetchErr || !currentVariant) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }

    const previousCount = currentVariant.inventory_count ?? 0;
    const changeAmount = nextCount - previousCount;

    // 2. Update variant count
    const { error: updateErr } = await supabase
      .from("product_variants")
      .update({ inventory_count: nextCount })
      .eq("id", variant_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // 3. Insert audit log in inventory_movements
    try {
      await supabase.from("inventory_movements").insert({
        variant_id,
        change_amount: changeAmount,
        previous_count: previousCount,
        new_count: nextCount,
        reason: adjustmentReason,
        performed_by: authResult.user?.email || "onestore.auth@gmail.com",
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error adjusting inventory";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
