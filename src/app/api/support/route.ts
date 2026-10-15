import { NextResponse } from "next/server";
import { dispatchSupportInquiry, getSupportTickets } from "@/lib/services/support";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await dispatchSupportInquiry(body);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error processing support inquiry";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tickets = getSupportTickets();
    return NextResponse.json({
      success: true,
      destination: "onestore.auth@gmail.com",
      ticketsCount: tickets.length,
      tickets,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error retrieving support tickets";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
