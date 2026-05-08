import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit";
import { invalidateSiteCache } from "@/lib/cache-invalidation";
import { PLANS, type PlanTier } from "@/lib/pricing";

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    logger.request("GET", "/api/sites", { userId: uid });

    const cacheKey = cacheKeys.sites(uid);
    const cached = await cache.get<any[]>(cacheKey);
    if (cached) {
      logger.cache("hit", cacheKey, { userId: uid });
      return NextResponse.json({ sites: cached });
    }

    const sites = await prisma.site.findMany({
      where: { ownerId: uid },
      orderBy: { createdAt: "desc" },
    });

    await cache.set(cacheKey, sites, cacheTTL.sites);
    return NextResponse.json({ sites });
  } catch (error) {
    logger.error("GET /api/sites failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, "read");

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.domain || !body.siteName || !body.niche) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check site limit
    const user = await prisma.user.findUnique({ where: { id: uid } });
    const plan = ((user?.planTier as PlanTier) || "free");
    const siteLimit = PLANS[plan].limits.siteConnections;
    const siteCount = await prisma.site.count({ where: { ownerId: uid } });

    if (siteCount >= siteLimit) {
      return NextResponse.json(
        { error: `You've reached your site limit (${siteLimit}). Upgrade to add more sites.`, limit: siteLimit, current: siteCount },
        { status: 403 }
      );
    }

    const site = await prisma.site.create({
      data: {
        ownerId: uid,
        domain: body.domain,
        siteName: body.siteName,
        niche: body.niche,
        targetCountry: body.targetCountry ?? "global",
        language: body.language ?? "en",
        brandVoice: {
          adjectives: body.brandVoiceAdjectives?.length ? body.brandVoiceAdjectives : ["neutral", "expert"],
          tone: body.brandVoiceTone || "",
          targetAudience: body.brandVoiceTargetAudience || "",
          formattingRules: body.brandVoiceFormattingRules || "",
        },
      },
    });

    await invalidateSiteCache(uid);
    return NextResponse.json({ siteId: site.id }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/sites failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, "write");
