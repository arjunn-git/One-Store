import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getProducts } from "@/lib/services/products";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const rawMarket = cookieStore.get("one_store_market")?.value;
    const market = rawMarket === "GB" ? "GB" : "IN";

    // Fast catalog prefetch
    const products = await getProducts({ market });

    return NextResponse.json({
      success: true,
      market,
      currency: market === "GB" ? "GBP" : "INR",
      productsCount: products.length,
      status: "ready",
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Initialization error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
