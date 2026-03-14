import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getWordPressSitesCollectionPath } from "@/lib/firestore/collections";
import { prepareSiteForStorage, validateCredentials, type WordPressCredentials } from "@/lib/wordpress/service";
import { requireAuth } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";

// GET - List all WordPress sites for the user
async function getWordPressSitesHandler(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Check cache first
    const cacheKey = cacheKeys.wordpressSites(user.uid);
    const cached = await cache.get<any>(cacheKey);
    
    if (cached) {
      logger.cache('hit', cacheKey, { userId: user.uid });
      return NextResponse.json(cached);
    }

    logger.cache('miss', cacheKey, { userId: user.uid });
    
    const sitesPath = getWordPressSitesCollectionPath(user.uid);
    const sitesSnapshot = await adminDb().collection(sitesPath).get();

    const sites = sitesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const result = { sites };

    // Cache the result
    await cache.set(cacheKey, result, cacheTTL.sites);
    logger.cache('set', cacheKey, { userId: user.uid });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    logger.error("Error fetching WordPress sites", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(getWordPressSitesHandler, 'read');

// POST - Connect a new WordPress site
async function connectWordPressSiteHandler(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { siteUrl, username, password } = body as WordPressCredentials;

    // Validate input
    if (!siteUrl || !username || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate credentials first
    const validation = await validateCredentials({ siteUrl, username, password });
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    // Prepare site data
    const siteData = prepareSiteForStorage(
      { siteUrl, username, password },
      user.uid,
      validation.siteName || siteUrl
    );

    // Save to Firestore
    const sitesPath = getWordPressSitesCollectionPath(user.uid);
    const docRef = await adminDb().collection(sitesPath).add({
      ...siteData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Invalidate WordPress sites cache
    const cacheKey = cacheKeys.wordpressSites(user.uid);
    await cache.del(cacheKey);
    logger.cache('del', cacheKey, { userId: user.uid });

    logger.info('WordPress site connected', { userId: user.uid, siteId: docRef.id });

    return NextResponse.json({
      success: true,
      siteId: docRef.id,
      siteName: siteData.siteName,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    logger.error("Error connecting WordPress site", error);
    return NextResponse.json(
      { error: "Failed to connect site" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(connectWordPressSiteHandler, 'write');
