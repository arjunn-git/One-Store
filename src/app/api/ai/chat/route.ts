import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  processAiAssistantChat,
  checkAiRateLimit,
} from "@/lib/services/ai-assistant";
import { recordActivity } from "@/lib/services/activity";
import type { AIChatRequest } from "@/lib/types/ai";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body: AIChatRequest = await request.json();

    if (!body || !body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "A message string is required." },
        { status: 400 }
      );
    }

    if (body.message.length > 1000) {
      return NextResponse.json(
        { error: "Message exceeds maximum allowed length of 1,000 characters." },
        { status: 400 }
      );
    }

    // Rate Limiting Guard (30 requests/minute per client)
    const rateLimitKey = `${ip}_${body.sessionId || "guest"}`;
    if (!checkAiRateLimit(rateLimitKey, 30, 60000)) {
      return NextResponse.json(
        {
          error:
            "Too many requests to the AI Assistant. Please pause for a moment before sending another query.",
        },
        { status: 429 }
      );
    }

    // Resolve user authentication from cookies (if present)
    const cookieStore = await cookies();
    const authEmail = cookieStore.get("one_store_user_email")?.value;
    const authUserId = cookieStore.get("one_store_user_id")?.value;

    const userAuth =
      authEmail || authUserId
        ? {
            userId: authUserId,
            email: authEmail,
          }
        : undefined;

    // Execute chat processing
    const result = await processAiAssistantChat(body, userAuth);

    // Record privacy-safe telemetry event into genuine operational stream
    try {
      await recordActivity({
        type: "AI_ASSISTANT_QUERY",
        action: `Customer inquired about ${result.products?.[0]?.name || "store services"}`,
        actor: authEmail ? `Customer (${authEmail.split("@")[0]})` : "Storefront Shopper",
        authUserId,
        anonymousSessionId: body.sessionId,
        market: body.market === "GB" ? "GB" : "IN",
        currency: body.market === "GB" ? "GBP" : "INR",
        resourceType: "ai_assistant",
        details: {
          provider: result.provider,
          hasRecommendations: (result.products?.length || 0) > 0,
        },
        ipAddress: ip,
      });
    } catch {
      // Non-blocking telemetry
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process chat query";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
