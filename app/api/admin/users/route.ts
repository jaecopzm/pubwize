import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const cursor = searchParams.get("cursor");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, email: true, displayName: true, planTier: true, planStatus: true, articlesUsed: true, createdAt: true },
  });

  const nextCursor = users.length === limit ? users[users.length - 1].id : null;

  return NextResponse.json({
    users: users.map((u) => ({ uid: u.id, ...u })),
    nextCursor,
  });
});
