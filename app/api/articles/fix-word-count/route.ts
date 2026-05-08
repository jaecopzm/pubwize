import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { authenticateRequest } from "@/lib/api-security";

function calculateWordCount(content: string): number {
  if (!content) return 0;
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~\[\](){}]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });

  const articles = await prisma.article.findMany({ where: { ownerId: auth.uid! } });

  let updated = 0;
  for (const article of articles) {
    const draft = article.draft as any;
    const outline = article.outline as any;
    let wordCount = 0;

    if (draft?.content) {
      wordCount = calculateWordCount(draft.content);
    } else if (outline?.sections) {
      const text = outline.sections.map((s: any) => `${s.title} ${s.content || ""}`).join(" ");
      wordCount = calculateWordCount(text);
    }

    await prisma.article.update({ where: { id: article.id }, data: { settings: { ...(article.settings as any), wordCount } as any } });
    updated++;
  }

  return NextResponse.json({ message: `Updated word count for ${updated} articles`, updated });
});
