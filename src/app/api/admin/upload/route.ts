import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/services/auth";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Unauthorized. Administrator privileges required." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and AVIF images are allowed." },
        { status: 400 }
      );
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 5MB size limit. Please upload an optimized image." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate clean unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueFilename = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 3. Attempt upload to Supabase Storage bucket 'product-images'
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from("product-images")
        .upload(uniqueFilename, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (!storageError && storageData) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("product-images").getPublicUrl(uniqueFilename);

        return NextResponse.json({
          success: true,
          url: publicUrl,
          filename: uniqueFilename,
          provider: "supabase-storage",
        });
      }
    } catch {
      // Supabase storage bucket may not be initialized yet
    }

    // 4. Robust local filesystem fallback in public/uploads/products
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/products/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
      provider: "local-public",
      note: "Stored in public/uploads/products. Configure Supabase 'product-images' bucket for cloud storage.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Image upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
