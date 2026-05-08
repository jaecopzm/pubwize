import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { restoreSnapshot } from "@/lib/services/version-history";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: articleId, versionId } = await params;

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await restoreSnapshot(null, articleId, versionId, userId);

    return NextResponse.json({ success: true, message: "Article restored to previous version" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (msg.includes("not found")) return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to restore version snapshot" }, { status: 500 });
  }
}
