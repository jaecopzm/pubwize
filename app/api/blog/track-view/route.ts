import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { articleId } = await req.json();
  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  await prisma.article.updateMany({
    where: { id: articleId, blogPublishedAt: { not: null } },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json({ success: true });
});
