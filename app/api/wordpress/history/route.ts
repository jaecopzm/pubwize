import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const history = await prisma.wordPressPublishHistory.findMany({
      where: {
        article: { ownerId: user.uid },
        ...(articleId ? { articleId } : {}),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ history });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error fetching publish history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { articleId, siteId, postId, postUrl, status, error: err, retryCount } = await request.json();

    if (!articleId || !siteId) {
      return NextResponse.json({ error: "articleId and siteId are required" }, { status: 400 });
    }

    const record = await prisma.wordPressPublishHistory.create({
      data: {
        articleId,
        siteId,
        postId: postId || null,
        postUrl: postUrl || null,
        status: status || "pending",
        error: err || null,
        retryCount: retryCount || 0,
      },
    });

    return NextResponse.json({ success: true, historyId: record.id });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error logging publish history:", error);
    return NextResponse.json({ error: "Failed to log history" }, { status: 500 });
  }
}
