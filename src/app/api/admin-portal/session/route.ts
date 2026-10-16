import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/services/admin-auth";

export async function GET() {
  const result = await verifyAdminRequest();
  if (!result.authorized) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    email: result.email,
  });
}
