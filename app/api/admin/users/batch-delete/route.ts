import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { uids } = (await req.json()) as { uids: string[] };
  if (!Array.isArray(uids) || uids.length === 0) return NextResponse.json({ error: "uids required" }, { status: 400 });
  if (uids.length > 50) return NextResponse.json({ error: "Max 50 at a time" }, { status: 400 });

  const results: { uid: string; ok: boolean; error?: string }[] = [];

  for (const uid of uids) {
    try {
      await prisma.user.delete({ where: { id: uid } });
      results.push({ uid, ok: true });
    } catch (e: any) {
      results.push({ uid, ok: false, error: e.message });
    }
  }

  return NextResponse.json({ results });
}
