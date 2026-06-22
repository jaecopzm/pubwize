import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GenerateBriefRequestBody, GenerateBriefResponse } from "@/lib/types";
import { generateBrief, aiUserContext } from "@/lib/ai-providers";
import { fetchSerpContext } from "@/lib/serper";
import { canPerformAction, incrementUsage } from "@/lib/usage-tracking";
import { withErrorHandler, QuotaExceededError, assertValid, ExternalServiceError } from "@/lib/error-handler";
import { authenticateRequest, validateRequestBody } from "@/lib/api-security";
import { checkRateLimitByIdentifier } from "@/lib/rate-limit";
import { validateKeyword } from "@/lib/validation";
import { invalidateArticleCache } from "@/lib/cache-invalidation";
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
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

  const body = (await req.json()) as GenerateBriefRequestBody;
  const validation = validateRequestBody(body, ["keyword", "siteId"], ["tone", "targetWordCount"]);
  assertValid(validation.valid, validation.error || "Invalid request");

  const { keyword, siteId } = body;
  assertValid(validateKeyword(keyword).valid, validateKeyword(keyword).error || "Invalid keyword");

  // Check usage quota
  const usageCheck = await canPerformAction(uid, "articles");
  if (!usageCheck.allowed) {
    throw new QuotaExceededError(
      usageCheck.reason || "Article limit reached",
      usageCheck.current || 0,
      usageCheck.limit || 0,
      "articles"
    );
  }

  // Ensure user exists
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

  // Validate site ownership
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  assertValid(!!site, "Site not found");
  assertValid(site!.ownerId === uid, "You don't have permission to access this site");

  // Fetch SERP context for Pro users
  let serpContext;
  if (user.planTier === "pro") {
    try {
      const siteData = site!.brandVoice as Record<string, unknown>;
      serpContext = await fetchSerpContext(keyword, (siteData as { targetCountry?: string })?.targetCountry ?? "us");
    } catch {
      // non-fatal
    }
  }

  const siteData = site!.brandVoice as Record<string, unknown>;
  let brief;
  try {
    brief = await aiUserContext.run(uid, () =>
      generateBrief({
        keyword,
        siteContext: {
          niche: site!.niche,
          targetCountry: site!.targetCountry,
          language: site!.language,
          brandVoice: siteData || undefined,
        },
        serpContext,
      })
    );
  } catch (err) {
    throw new ExternalServiceError("AI generation service", err);
  }

  const article = await prisma.article.create({
    data: {
      ownerId: uid,
      siteId,
      keyword,
      status: "brief_generated",
      intent: brief.intent,
      articleType: brief.articleType,
      brief: brief as any,
      settings: {
        tone: body.tone ?? "neutral",
        targetWordCount: body.targetWordCount ?? null,
      },
    },
  });

  await incrementUsage(uid, "articles");

  await invalidateArticleCache(article.id, uid);

  const response: GenerateBriefResponse = {
    articleId: article.id,
    brief,
    intent: brief.intent,
    articleType: brief.articleType,
  };

  return NextResponse.json(response);
});
