import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { articleId, date } = await request.json();
    if (!articleId || !date) return NextResponse.json({ error: "articleId and date are required" }, { status: 400 });

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.article.update({ where: { id: articleId }, data: { scheduledDate: new Date(date) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error scheduling article:", error);
    return NextResponse.json({ error: "Failed to schedule article" }, { status: 500 });
  }
}
