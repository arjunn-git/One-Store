import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, isLiveSupabaseConfigured } from "@/lib/services/auth";
import { FALLBACK_CATEGORIES } from "@/lib/services/products";

export async function GET() {
  try {
    if (!isLiveSupabaseConfigured()) {
      return NextResponse.json({ success: true, categories: FALLBACK_CATEGORIES });
    }

    const supabase = await createClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, categories: categories || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching categories";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, image_url } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const cleanSlug =
      slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        image_url: image_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating category";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
