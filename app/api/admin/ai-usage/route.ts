import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // AI usage logs are not stored in Prisma schema yet
  // Return empty for now
  return NextResponse.json({ logs: [], byProvider: {}, byTask: {}, total: 0 });
}
