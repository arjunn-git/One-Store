import { NextResponse } from "next/server";
import { getAiTelemetrySummary } from "@/lib/services/ai-assistant";

export async function GET() {
  try {
    const summary = getAiTelemetrySummary();
    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load AI analytics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
