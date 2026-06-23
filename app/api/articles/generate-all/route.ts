import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  streamBriefRaw,
  streamOutlineRaw,
  generateDraftStream,
  streamOptimizationRaw,
  aiUserContext,
} from "@/lib/ai-providers";
import { injectImagesIntoMarkdown } from "@/lib/unsplash";
import { withErrorHandler, assertValid } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { checkRateLimitByIdentifier } from "@/lib/rate-limit";
import { validateArticleId } from "@/lib/validation";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
import { asSettings } from "@/lib/prisma-json";
import type { BriefData, OutlineData, SiteBrandVoice } from "@/lib/types";
import { fetchSerpContext } from "@/lib/serper";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = await checkRateLimitByIdentifier(uid, 10, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json();
  const validation = validateRequestBody(body, ["articleId"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { articleId } = body;
  assertValid(validateArticleId(articleId).valid, "Invalid article ID");

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  assertValid(!!article, "Article not found");
  assertValid(article!.ownerId === uid, "You don't have permission to access this article");
  assertValid(!!article!.keyword, "Article missing keyword");

  const keyword = article!.keyword;
  const settings = asSettings(article!.settings);
  const tone = settings?.tone ?? "neutral";
  const targetWordCount = settings?.targetWordCount ?? null;

  const site = await prisma.site.findUnique({ where: { id: article!.siteId } });
  const brandVoice = (site as { brandVoice: any } | null)?.brandVoice || null;

  // Fetch SERP context so drafts can include real, non-hallucinated external links.
  let serpContext: any = null;
  try {
    serpContext = await fetchSerpContext(keyword, site?.targetCountry ?? "us");
  } catch {
    serpContext = null;
  }

  const internalLinkArticles = await prisma.article.findMany({
    where: { ownerId: uid, publishedUrl: { not: null }, NOT: { id: articleId } },
    select: { keyword: true, publishedUrl: true },
    take: 20,
  });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const send = (data: any) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

  aiUserContext.run(uid, async () => {
    try {
      // ── Phase 1: Brief ──────────────────────────────────────────────
      await writer.write(send({ phase: "brief" }));
      let brief: BriefData | null = null;
      
      for await (const item of streamBriefRaw({
        keyword,
        siteContext: {
          niche: site?.niche,
          targetCountry: site?.targetCountry,
          language: site?.language,
          brandVoice: brandVoice || undefined,
        },
        serpContext: serpContext || undefined,
      })) {
        if (typeof item === "string") {
          await writer.write(send({ thinkingChunk: item }));
        } else {
          brief = item.__done;
          await prisma.article.update({
            where: { id: articleId },
            data: {
              brief: brief as any,
              intent: brief.intent,
              articleType: brief.articleType,
              status: "brief_generated",
            },
          });
          await writer.write(send({ briefDone: brief }));
        }
      }
      if (!brief) throw new Error("Brief generation failed");

      // ── Phase 2: Outline ────────────────────────────────────────────
      await writer.write(send({ phase: "outline" }));
      let outline: OutlineData | null = null;

      for await (const item of streamOutlineRaw({ brief, keyword })) {
        if (typeof item === "string") {
          await writer.write(send({ thinkingChunk: item }));
        } else {
          outline = item.__done;
          await prisma.article.update({
            where: { id: articleId },
            data: { outline: outline as any, status: "outline_generated" },
          });
          await writer.write(send({ outlineDone: outline }));
        }
      }
      if (!outline) throw new Error("Outline generation failed");

      // ── Phase 3: Draft (Streaming) ──────────────────────────────────
      await writer.write(send({ phase: "draft" }));
      let fullContent = "";
      const externalSources = (serpContext?.topResults ?? [])
        .filter((r: any) => r?.title && r?.link)
        .slice(0, 10)
        .map((r: any) => ({ title: r.title, url: r.link, snippet: r.snippet }));

      for await (const chunk of generateDraftStream({
        outline,
        keyword,
        tone,
        targetWordCount,
        lsiKeywords: [],
        siteBrandVoice: brandVoice,
        internalLinkArticles,
        externalSources: externalSources.length > 0 ? externalSources : null,
      })) {
        fullContent += chunk;
        await writer.write(send({ chunk }));
      }

      // Save draft immediately so it's not lost if SEO phase fails
      let draftContent = fullContent;
      const hasUnsplashKey = !!(process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY);
      if (hasUnsplashKey) {
        try {
          draftContent = await injectImagesIntoMarkdown(fullContent);
        } catch { /* non-fatal */ }
      }

      await prisma.article.update({
        where: { id: articleId },
        data: {
          draft: { content: draftContent, format: "markdown" },
          status: "draft_generated",
        },
      });

      // ── Phase 4: SEO Optimization (on REAL content) ─────────────────
      await writer.write(send({ phase: "seo" }));
      let optimization: any = null;

      try {
        for await (const item of streamOptimizationRaw({
          keyword,
          content: draftContent, // ← Fixed: was "" before, now uses actual content
        })) {
          if (typeof item === "string") {
            await writer.write(send({ thinkingChunk: item }));
          } else {
            optimization = item.__done;
            await prisma.article.update({
              where: { id: articleId },
              data: { optimizations: optimization, status: "optimized" },
            });
            await writer.write(send({ seoDone: optimization }));
          }
        }
      } catch (seoErr) {
        // Non-fatal: article is still usable without SEO suggestions
        logger.warn("[Auto-Pilot] SEO phase failed", seoErr);
        optimization = { lsiKeywords: [], suggestions: [] };
        await writer.write(send({ seoSkipped: true }));
      }

      await invalidateArticleCache(articleId, uid);
      await writer.write(send({ done: true, articleId }));
    } catch (err: any) {
      logger.error("[Auto-Pilot] Pipeline failed", err);
      await writer.write(send({ error: err?.message || "Generation failed." }));
    } finally {
      await writer.close();
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
});
