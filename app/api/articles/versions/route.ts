import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRateLimit } from "@/lib/rate-limit";

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { articleId, content, status } = await req.json();
    if (!articleId || !content) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article || article.ownerId !== uid) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const snapshot = await prisma.versionSnapshot.create({
      data: {
        articleId,
        userId: uid,
        changeDescription: "Manual save",
        contentType: "draft",
        snapshot: { content, status: status || article.status },
      },
    });

    return NextResponse.json({ versionId: snapshot.id });
  } catch (error) {
    console.error("Version save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, "write");

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");
    if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

    const versions = await prisma.versionSnapshot.findMany({
      where: { articleId, userId: uid },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Version fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, "read");
