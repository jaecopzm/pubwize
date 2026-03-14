import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { OptimizationData } from "@/lib/types";
import { optimizeDraft, getInternalLinkSuggestions, getQualityMetricsWithOpenRouter } from "@/lib/ai-providers";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (max for Vercel Pro)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const body = (await req.json()) as { articleId?: string };
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: "Missing articleId" },
        { status: 400 },
      );
    }

    const db = adminDb();
    const articleRef = db.collection("articles").doc(articleId);
    const articleSnap = await articleRef.get();

    if (!articleSnap.exists) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 },
      );
    }

    const articleData = articleSnap.data() as {
      ownerId?: string;
      siteId?: string;
      keyword?: string;
      draft?: { content?: string };
    };

    if (articleData.ownerId !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!articleData.draft?.content) {
      return NextResponse.json(
        { error: "Article has no draft" },
        { status: 400 },
      );
    }

    if (!articleData.keyword) {
      return NextResponse.json(
        { error: "Article missing keyword" },
        { status: 400 },
      );
    }

    const optimization: OptimizationData = await optimizeDraft({
      keyword: articleData.keyword,
      content: articleData.draft.content,
    });

    // 6.5 Elite Upgrades: Internal Linking & Quality Audit
    try {
      // Fetch 15 most recent published articles for context
      const otherArticlesSnap = await db.collection("articles")
        .where("siteId", "==", articleData.siteId)
        .where("ownerId", "==", uid)
        .where("status", "==", "optimized") // consider "optimized" or tracked published status
        .limit(15)
        .get();

      const otherArticles = otherArticlesSnap.docs
        .filter(doc => doc.id !== articleId)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.keyword || "Untitled",
            publishedUrl: data.publishedUrl || null
          };
        });

      const [internalLinks, qualityMetrics] = await Promise.all([
        getInternalLinkSuggestions({
          currentContent: articleData.draft.content,
          otherArticles
        }),
        getQualityMetricsWithOpenRouter({
          content: articleData.draft.content
        })
      ]);

      optimization.internalLinks = internalLinks;
      optimization.aiDetection = {
        score: qualityMetrics.score,
        riskLevel: qualityMetrics.riskLevel
      };

      // We could also store more detailed metrics if needed
    } catch (eliteErr) {
      console.error("Elite SEO features failed:", eliteErr);
    }

    const now = new Date();
    await articleRef.update({
      optimizations: optimization,
      status: "optimized",
      updatedAt: now,
    });

    return NextResponse.json(
      {
        articleId,
        optimization,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in /api/articles/optimize", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

