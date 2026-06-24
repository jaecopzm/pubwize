import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { generateDraftStream, aiUserContext } from "@/lib/ai-providers";
import { withErrorHandler, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { checkRateLimitByIdentifier } from "@/lib/rate-limit";
import { validateArticleId } from "@/lib/validation";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
import { asSettings, asOptimizations, asOutline } from "@/lib/prisma-json";
import { fetchSerpContext } from "@/lib/serper";
import { injectImagesIntoMarkdown } from "@/lib/unsplash";
import { clerkClient } from "@clerk/nextjs/server";
import { ensureUserRecord } from "@/lib/ensure-user";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  assertValid(auth.success, auth.error || "Authentication failed");
  const uid = auth.uid!;

  const rateLimit = await checkRateLimitByIdentifier(uid, 30, 60000);
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

  const settings = asSettings(article!.settings);
  const tone = settings?.tone ?? "neutral";
  const targetWordCount = bodyWordCount || settings?.targetWordCount || 2000;
  const optimizations = asOptimizations(article!.optimizations);
  const lsiKeywords = optimizations?.lsiKeywords || [];
  // Include existing SEO suggestions so regenerated drafts apply them automatically
  const seoSuggestions: string[] | null = optimizations?.suggestions?.length
    ? optimizations.suggestions
    : null;

  const site = await prisma.site.findUnique({ where: { id: article!.siteId } });
  const siteBrandVoice = (site as { brandVoice: any } | null)?.brandVoice || null;

  // Determine plan tier (used for SERP-enriched external sources).
  let user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(uid);
    const ensured = await ensureUserRecord(uid, {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null,
      photoURL: clerkUser.imageUrl || null,
    });

    user = ensured.user;
  }

  // Provide real, non-hallucinated URLs the model is allowed to cite.
  let externalSources: Array<{ title: string; url: string; snippet?: string }> | null = null;
  try {
    const serp = await fetchSerpContext(article!.keyword, site?.targetCountry ?? "us");
    externalSources = serp.topResults
      .filter(r => r.title && r.link)
      .slice(0, 10)
      .map(r => ({ title: r.title, url: r.link, snippet: r.snippet }));
  } catch {
    // non-fatal (SERP context is a best-effort enhancement)
  }

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
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        logger.info(`[Draft] Starting generation for article ${articleId}, target: ${targetWordCount} words (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        const generator = aiUserContext.run(uid, () =>
          generateDraftStream({
            outline: asOutline(article!.outline),
            keyword: article!.keyword,
            tone,
            targetWordCount,
            lsiKeywords,
            siteBrandVoice,
            internalLinkArticles,
            externalSources,
            seoSuggestions,
          })
        );

        let chunkCount = 0;
        for await (const chunk of generator) {
          fullContent += chunk;
          chunkCount++;
          await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        }
        
        logger.info(`[Draft] Generated ${chunkCount} chunks, total length: ${fullContent.length} chars`);

        // Check if content was cut off (too short)
        const wordCount = fullContent.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < targetWordCount * 0.5 && retryCount < maxRetries) {
          logger.info(`[Draft] Content too short (${wordCount} words), retrying...`);
          fullContent = "";
          retryCount++;
          await writer.write(encoder.encode(`data: ${JSON.stringify({ retry: retryCount })}\n\n`));
          continue;
        }

        let finalContent = fullContent.trim();
        if (finalContent.startsWith("```markdown")) {
          finalContent = finalContent.replace(/^```markdown\s*\n/, "").replace(/\n```$/, "").trim();
        } else if (finalContent.startsWith("```")) {
          finalContent = finalContent.replace(/^```[a-zA-Z]*\s*\n/, "").replace(/\n```$/, "").trim();
        }

        const finalWordCount = finalContent
          .replace(/`[^`]*`/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/[#*_~\[\](){}]/g, "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length;

        // Only inject real images when an Unsplash key is configured.
        const hasUnsplashKey = !!(process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY);
        if (hasUnsplashKey) {
          try {
            finalContent = await injectImagesIntoMarkdown(finalContent);
          } catch {
            // non-fatal
          }
        }

        await prisma.article.update({
          where: { id: articleId },
          data: {
            draft: { content: finalContent, format: "markdown" },
            status: "draft",
            settings: { ...settings, targetWordCount },
          },
        });

        await invalidateArticleCache(articleId, uid);

        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, articleId })}\n\n`));
        break; // Success, exit retry loop
        
      } catch (err) {
        logger.error(`[Draft] Attempt ${retryCount + 1} failed`, err);
        
        if (retryCount < maxRetries) {
          retryCount++;
          fullContent = "";
          await writer.write(encoder.encode(`data: ${JSON.stringify({ retry: retryCount })}\n\n`));
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        } else {
          logger.error("[Draft] All retry attempts failed");
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ error: "Generation failed after multiple attempts. Please try again." })}\n\n`)
          );
          break;
        }
      }
    }
    
    await writer.close();
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
