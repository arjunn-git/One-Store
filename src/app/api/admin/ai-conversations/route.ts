import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/services/admin-auth";
import { getAiConversations } from "@/lib/services/ai-assistant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
    }

    const conversations = getAiConversations();
    return NextResponse.json({
      success: true,
      total: conversations.length,
      conversations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load AI conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
