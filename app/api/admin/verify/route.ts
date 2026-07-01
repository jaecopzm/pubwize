import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ admin: false }, { status: 200 });
  }
  return NextResponse.json({ admin: true, uid: admin.uid });
});
