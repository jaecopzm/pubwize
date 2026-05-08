import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [recentUsers, recentArticles] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, email: true, createdAt: true } }),
    prisma.article.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { id: true, keyword: true, ownerId: true, createdAt: true } }),
  ]);

  const events = [
    ...recentUsers.map((u) => ({ type: "signup" as const, id: u.id, label: u.email, ts: u.createdAt })),
    ...recentArticles.map((a) => ({ type: "article" as const, id: a.id, label: a.keyword || "Untitled", userId: a.ownerId, ts: a.createdAt })),
  ]
    .sort((a, b) => b.ts.getTime() - a.ts.getTime())
    .slice(0, 40);

  return NextResponse.json({ events });
}
