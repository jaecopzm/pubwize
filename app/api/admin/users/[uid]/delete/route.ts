import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uid } = await params;
  // Cascade deletes articles, sites, etc. via Prisma relations
  await prisma.user.delete({ where: { id: uid } });
  return NextResponse.json({ ok: true });
}
