import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { invalidateSiteCache } from "@/lib/cache-invalidation";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: siteId } = await params;
    const site = await prisma.site.findUnique({ where: { id: siteId } });

    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
    if (site.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.site.delete({ where: { id: siteId } });
    await cache.del(cacheKeys.site(siteId));
    await invalidateSiteCache(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting site", error);
    return NextResponse.json({ error: "Failed to delete site" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: siteId } = await params;
    const body = await request.json();

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
    if (site.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const existingBrandVoice = (site.brandVoice as Record<string, unknown>) || {};
    const brandVoice = (body.brandVoiceAdjectives || body.brandVoiceTone || body.brandVoiceTargetAudience || body.brandVoiceFormattingRules)
      ? {
          ...existingBrandVoice,
          adjectives: body.brandVoiceAdjectives?.length ? body.brandVoiceAdjectives : existingBrandVoice.adjectives || ["neutral", "expert"],
          tone: body.brandVoiceTone ?? existingBrandVoice.tone ?? "",
          targetAudience: body.brandVoiceTargetAudience ?? existingBrandVoice.targetAudience ?? "",
          formattingRules: body.brandVoiceFormattingRules ?? existingBrandVoice.formattingRules ?? "",
        }
      : undefined;

    await prisma.site.update({
      where: { id: siteId },
      data: {
        ...(body.domain && { domain: body.domain }),
        ...(body.siteName && { siteName: body.siteName }),
        ...(body.niche && { niche: body.niche }),
        ...(body.targetCountry && { targetCountry: body.targetCountry }),
        ...(body.language && { language: body.language }),
        ...(brandVoice && { brandVoice }),
      },
    });

    await cache.del(cacheKeys.site(siteId));
    await invalidateSiteCache(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating site", error);
    return NextResponse.json({ error: "Failed to update site" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: siteId } = await params;
    const cacheKey = cacheKeys.site(siteId);
    const cached = await cache.get<any>(cacheKey);
    if (cached) return NextResponse.json({ site: cached });

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });
    if (site.ownerId !== userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await cache.set(cacheKey, site, cacheTTL.site);
    return NextResponse.json({ site });
  } catch (error) {
    logger.error("Error fetching site", error);
    return NextResponse.json({ error: "Failed to fetch site" }, { status: 500 });
  }
}
