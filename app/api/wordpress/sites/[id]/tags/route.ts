import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTags } from "@/lib/wordpress/service";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id: siteId } = await params;

    const site = await prisma.wordPressSite.findUnique({ where: { id: siteId } });
    if (!site || site.userId !== user.uid) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const tags = await getTags(site as any);
    return NextResponse.json({ tags });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
