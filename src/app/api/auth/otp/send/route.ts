import { NextResponse } from "next/server";
import { createAndSendOtp } from "@/lib/services/customer-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, mode, fullName, marketingConsent } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (mode !== "login" && mode !== "signup") {
      return NextResponse.json(
        { success: false, error: "Invalid authentication mode specified." },
        { status: 400 }
      );
    }

    const result = await createAndSendOtp(email, mode, {
      fullName: typeof fullName === "string" ? fullName.trim() : undefined,
      marketingConsent: !!marketingConsent,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          rateLimited: result.rateLimited,
          retryAfter: result.retryAfter,
          notFound: result.notFound,
          exists: result.exists,
        },
        { status: result.rateLimited ? 429 : result.notFound ? 404 : result.exists ? 409 : 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
