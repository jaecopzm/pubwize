import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { articleId } = await request.json();
    if (!articleId) return NextResponse.json({ error: "articleId is required" }, { status: 400 });

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.article.update({ where: { id: articleId }, data: { scheduledDate: null } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unscheduling article:", error);
    return NextResponse.json({ error: "Failed to unschedule article" }, { status: 500 });
  }
}
