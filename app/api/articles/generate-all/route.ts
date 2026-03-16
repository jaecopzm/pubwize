import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
    streamBriefRaw,
    streamOutlineRaw,
    generateDraftStream,
    streamOptimizationRaw,
    aiUserContext,
} from "@/lib/ai-providers";
import { injectImagesIntoMarkdown } from "@/lib/unsplash";
import { withErrorHandler, assertValid } from "@/lib/error-handler";
import { authenticateRequest, checkRateLimit, validateRequestBody } from "@/lib/api-security";
import { validateArticleId } from "@/lib/validation";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { getUserPlan } from "@/lib/pricing";
import type { BriefData, OutlineData, ArticleDoc, SiteBrandVoice } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/articles/generate-all
 *
 * Fully-streaming Auto-Pilot: Brief → Outline → Draft → SEO in one SSE chain.
 * PRO ONLY FEATURE - Bulk generation
 *
 * SSE event shapes:
 *   { phase: "brief" | "outline" | "draft" | "seo" }   — phase start
 *   { thinkingChunk: string }                           — raw token for JSON phases (brief/outline/seo)
 *   { chunk: string }                                   — draft text token
 *   { briefDone: BriefData }                            — brief parsed & saved
 *   { outlineDone: OutlineData }                        — outline parsed & saved
 *   { seoDone: OptimizationData }                       — SEO parsed & saved
 *   { done: true, articleId: string }                   — all complete
 *   { error: string }                                   — failure
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
    const auth = await authenticateRequest(req);
    assertValid(auth.success, auth.error || "Authentication failed");
    const uid = auth.uid!;

    const rateLimit = checkRateLimit(uid, 10, 60000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
        );
    }

    const body = await req.json();
    const validation = validateRequestBody(body, ["articleId"]);
    assertValid(validation.valid, validation.error || "Invalid request");

    const { articleId } = body;
    const idValidation = validateArticleId(articleId);
    assertValid(idValidation.valid, idValidation.error || "Invalid article ID");

    const db = adminDb();
    const articleRef = db.collection("articles").doc(articleId);
    const articleSnap = await articleRef.get();

    assertValid(articleSnap.exists, "Article not found");
    const articleData = articleSnap.data() as ArticleDoc;

    assertValid(articleData.ownerId === uid, "You don't have permission to access this article");
    assertValid(!!articleData.keyword, "Article missing keyword");

    const keyword = articleData.keyword!;
    const tone = articleData.settings?.tone ?? "neutral";
    const targetWordCount = articleData.settings?.targetWordCount ?? null;

    // fetch the parent site so we can read its voice settings
    const siteSnap = await db.collection("sites").doc(articleData.siteId as string).get();
    const siteData = siteSnap.exists
        ? (siteSnap.data() as { brandVoice?: SiteBrandVoice })
        : {};

    // Use site brand voice for draft generation
    const brandVoice = siteData.brandVoice || null;

    // Fetch user's other published articles for internal linking
    const otherArticlesSnap = await db.collection("articles")
        .where("ownerId", "==", uid)
        .where("publishedUrl", "!=", null)
        .limit(20)
        .get();
    const internalLinkArticles = otherArticlesSnap.docs
        .filter(doc => doc.id !== articleId)
        .map(doc => ({ keyword: doc.data().keyword as string, publishedUrl: doc.data().publishedUrl as string | null }));

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const send = (data: any) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

    aiUserContext.run(uid, async () => {
        try {
            // ── Phase 1: Brief (streaming tokens + done event) ─────────
            await writer.write(send({ phase: "brief" }));

            let brief: BriefData | null = null;
            for await (const item of streamBriefRaw({
                keyword,
                siteContext: {
                    niche: articleData.settings?.niche,
                    targetCountry: articleData.settings?.targetCountry,
                    language: articleData.settings?.language,
                },
            })) {
                if (typeof item === "string") {
                    await writer.write(send({ thinkingChunk: item }));
                } else {
                    brief = item.__done;
                    await articleRef.update({ brief, status: "brief_generated", updatedAt: new Date() });
                    await writer.write(send({ briefDone: brief }));
                }
            }

            if (!brief) throw new Error("Brief generation failed");

            // ── Phase 2: Outline (streaming tokens + done event) ────────
            await writer.write(send({ phase: "outline" }));

            let outline: OutlineData | null = null;
            for await (const item of streamOutlineRaw({ brief })) {
                if (typeof item === "string") {
                    await writer.write(send({ thinkingChunk: item }));
                } else {
                    outline = item.__done;
                    await articleRef.update({ outline, status: "outline_generated", updatedAt: new Date() });
                    await writer.write(send({ outlineDone: outline }));
                }
            }

            if (!outline) throw new Error("Outline generation failed");

            // ── Phase 3: SEO Optimization (to get LSI keywords for draft) ──
            await writer.write(send({ phase: "seo" }));

            let optimization: any = null;
            try {
                for await (const item of streamOptimizationRaw({ keyword, content: "" })) {
                    if (typeof item === "string") {
                        await writer.write(send({ thinkingChunk: item }));
                    } else {
                        optimization = item.__done;
                        await articleRef.update({
                            optimization,
                            updatedAt: new Date(),
                        });
                        await writer.write(send({ seoDone: optimization }));
                    }
                }
            } catch (error) {
                console.error("Optimization error:", error);
                // Continue with empty LSI keywords if optimization fails
                optimization = { lsiKeywords: [] };
            }

            const lsiKeywords = optimization?.lsiKeywords || [];

            // ── Phase 4: Draft (word-by-word streaming) ─────────────────
            await writer.write(send({ phase: "draft" }));

            let fullContent = "";
            for await (const chunk of generateDraftStream({ 
                outline, 
                keyword, 
                tone, 
                targetWordCount, 
                lsiKeywords, 
                siteBrandVoice: brandVoice, 
                internalLinkArticles,
                useBulkModel: true // Use faster model for bulk generation
            })) {
                fullContent += chunk;
                await writer.write(send({ chunk }));
            }

            let draft = { content: fullContent, format: "markdown" as const };

            // ── Phase 3.5: Image Injection ──────────────────────────────
            try {
                const contentWithImages = await injectImagesIntoMarkdown(fullContent);
                draft.content = contentWithImages;
            } catch (imgErr) {
                console.warn("Automated image injection failed:", imgErr);
            }

            await articleRef.update({ draft, status: "optimized", updatedAt: new Date() });


            await writer.write(send({ done: true, articleId }));
        } catch (err: any) {
            console.error("Auto-pilot generation failed:", err);
            await writer.write(send({ error: err?.message || "Generation failed. Please try again." }));
        } finally {
            await writer.close();
        }
    });

    return new Response(readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Encoding": "none",
        },
    });
});
