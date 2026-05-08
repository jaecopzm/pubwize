import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkConnectionHealth } from "@/lib/wordpress/service";
import { requireAuth } from "@/lib/auth";
import type { WordPressSite } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: siteId } = await params;

    const site = await prisma.wordPressSite.findUnique({ where: { id: siteId } });
    if (!site || site.userId !== user.uid) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const health = await checkConnectionHealth(site as any);

    await prisma.wordPressSite.update({
      where: { id: siteId },
      data: { lastValidated: new Date(), connected: health.healthy },
    });

    return NextResponse.json(health);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error checking site health:", error);
    return NextResponse.json({ error: "Failed to check site health" }, { status: 500 });
  }
}
