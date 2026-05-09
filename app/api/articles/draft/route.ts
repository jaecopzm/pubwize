import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDraftStream, aiUserContext } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = checkRateLimit(uid, 30, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json();
  const validation = validateRequestBody(body, ["articleId"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { articleId, targetWordCount: bodyWordCount } = body;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  assertValid(!!article, "Article not found");
  assertValid(article!.ownerId === uid, "You don't have permission to access this article");
  assertValid(!!article!.outline, "No outline found. Please generate an outline first.");

  const settings = article!.settings as any;
  const tone = settings?.tone ?? "neutral";
  const targetWordCount = bodyWordCount || settings?.targetWordCount || 2000;
  const optimizations = article!.optimizations as any;
  const lsiKeywords = optimizations?.lsiKeywords || [];

  const site = await prisma.site.findUnique({ where: { id: article!.siteId } });
  const siteBrandVoice = (site as any)?.brandVoice || null;

  const internalLinkArticles = await prisma.article.findMany({
    where: { ownerId: uid, publishedUrl: { not: null }, NOT: { id: articleId } },
    select: { keyword: true, publishedUrl: true },
    take: 20,
  });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let fullContent = "";

  (async () => {
    try {
      console.log(`[Draft] Starting generation for article ${articleId}, target: ${targetWordCount} words`);
      
      const generator = aiUserContext.run(uid, () =>
        generateDraftStream({
          outline: article!.outline as any,
          keyword: article!.keyword,
          tone,
          targetWordCount,
          lsiKeywords,
          siteBrandVoice,
          internalLinkArticles,
        })
      );

      let chunkCount = 0;
      for await (const chunk of generator) {
        fullContent += chunk;
        chunkCount++;
        await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }
      
      console.log(`[Draft] Generated ${chunkCount} chunks, total length: ${fullContent.length} chars`);

      let finalContent = fullContent.trim();
      if (finalContent.startsWith("```markdown")) {
        finalContent = finalContent.replace(/^```markdown\s*\n/, "").replace(/\n```$/, "").trim();
      } else if (finalContent.startsWith("```")) {
        finalContent = finalContent.replace(/^```[a-zA-Z]*\s*\n/, "").replace(/\n```$/, "").trim();
      }

      const wordCount = finalContent
        .replace(/`[^`]*`/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[#*_~\[\](){}]/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;

      await prisma.article.update({
        where: { id: articleId },
        data: {
          draft: { content: finalContent, format: "markdown" } as any,
          status: "draft_generated",
          settings: { ...settings, targetWordCount } as any,
        },
      });

      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, articleId })}\n\n`));
    } catch (err) {
      console.error("Streaming draft generation failed:", err);
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: "Generation failed. Please try again." })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
});
