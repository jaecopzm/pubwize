import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/wordpress/service";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id: siteId } = await params;

    const site = await prisma.wordPressSite.findUnique({ where: { id: siteId } });
    if (!site || site.userId !== user.uid) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const categories = await getCategories(site as any);
    return NextResponse.json({ categories });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
