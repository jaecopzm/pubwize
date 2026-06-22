import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { withErrorHandler } from "@/lib/error-handler";

export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;

  const [user, articles, sites] = await Promise.all([
    prisma.user.findUnique({ where: { id: uid } }),
    prisma.article.findMany({ where: { ownerId: uid }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.site.findMany({ where: { ownerId: uid } }),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user: { uid, ...user }, articles, sites });
});

export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) => {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  const body = await req.json();

  const data: any = {};
  if ("planTier" in body) data.planTier = body.planTier;
  if ("planStatus" in body) data.planStatus = body.planStatus;

  await prisma.user.update({ where: { id: uid }, data });
  return NextResponse.json({ success: true });
});
