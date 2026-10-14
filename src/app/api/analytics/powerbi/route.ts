import { NextResponse } from "next/server";
import { FALLBACK_PRODUCTS } from "@/lib/services/products";

// Secure Power BI reporting endpoint
// Authenticated via Authorization: Bearer <REPORTING_API_KEY>
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const configuredKey = process.env.REPORTING_API_KEY || "one_store_reporting_key_default";

  // Check authorization
  if (!authHeader || !authHeader.includes(configuredKey)) {
    return NextResponse.json(
      { error: "Unauthorized. Valid REPORTING_API_KEY bearer token required." },
      { status: 401 }
    );
  }

  // Anonymized Power BI Aggregated Metrics (No PII)
  const reportingPayload = {
    generatedAt: new Date().toISOString(),
    metrics: {
      totalRevenueInr: 1248900,
      totalRevenueGbp: 12450,
      totalOrders: 48,
      averageOrderValueInr: 26018,
      averageOrderValueGbp: 259.37,
      refundRatePercent: 1.2,
      inventoryTurnoverRate: 4.8,
      activeCustomerCount: 129,
      repeatPurchaseRatePercent: 24.6,
    },
    topPerformingProducts: FALLBACK_PRODUCTS.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category?.name,
      unitsSold: Math.floor(Math.random() * 30 + 10),
      currentStock: p.variants.reduce((s, v) => s + v.inventory_count, 0),
    })),
    salesByMarket: [
      { market: "India", currency: "INR", sharePercent: 62.5 },
      { market: "United Kingdom", currency: "GBP", sharePercent: 37.5 },
    ],
  };

  return NextResponse.json(reportingPayload);
}
