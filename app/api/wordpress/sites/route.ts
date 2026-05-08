import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prepareSiteForStorage, validateCredentials, type WordPressCredentials } from "@/lib/wordpress/service";
import { requireAuth } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";

async function getWordPressSitesHandler(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const cacheKey = cacheKeys.wordpressSites(user.uid);
    const cached = await cache.get<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const sites = await prisma.wordPressSite.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: "desc" },
    });

    const result = { sites };
    await cache.set(cacheKey, result, cacheTTL.sites);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) return error;
    logger.error("Error fetching WordPress sites", error);
    return NextResponse.json({ error: "Failed to fetch sites" }, { status: 500 });
  }
}

export const GET = withRateLimit(getWordPressSitesHandler, "read");

async function connectWordPressSiteHandler(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { siteUrl, username, password } = body as WordPressCredentials;

    if (!siteUrl || !username || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validation = await validateCredentials({ siteUrl, username, password });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Invalid credentials" }, { status: 401 });
    }

    const siteData = prepareSiteForStorage({ siteUrl, username, password }, user.uid, validation.siteName || siteUrl);

    const site = await prisma.wordPressSite.create({
      data: {
        userId: user.uid,
        siteUrl: siteData.siteUrl,
        siteName: siteData.siteName,
        username: siteData.username,
        encryptedPassword: siteData.encryptedPassword,
        connected: true,
      },
    });

    await cache.del(cacheKeys.wordpressSites(user.uid));
    return NextResponse.json({ success: true, siteId: site.id, siteName: site.siteName });
  } catch (error) {
    if (error instanceof Response) return error;
    logger.error("Error connecting WordPress site", error);
    return NextResponse.json({ error: "Failed to connect site" }, { status: 500 });
  }
}

export const POST = withRateLimit(connectWordPressSiteHandler, "write");
