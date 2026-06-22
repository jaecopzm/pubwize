import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";

export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  // Cascade deletes articles, sites, etc. via Prisma relations
  await prisma.user.delete({ where: { id: uid } });
  logger.info("Admin delete user", { adminId: admin.uid, deletedUserId: uid });
  return NextResponse.json({ success: true });
});
