import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limit";
import { invalidateSiteCache } from "@/lib/cache-invalidation";
import { PLANS, type PlanTier } from "@/lib/pricing";

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    logger.request('GET', '/api/sites', { userId: uid });

    // Try cache first
    const cacheKey = cacheKeys.sites(uid);
    const cached = await cache.get<any[]>(cacheKey);

    if (cached) {
      logger.cache('hit', cacheKey, { userId: uid });
      return NextResponse.json({ sites: cached });
    }

    logger.cache('miss', cacheKey, { userId: uid });

    const db = adminDb();
    logger.database('query', 'sites', { userId: uid });

    const sitesSnapshot = await db
      .collection("sites")
      .where("ownerId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const sites = sitesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cache the result
    await cache.set(cacheKey, sites, cacheTTL.sites);
    logger.cache('set', cacheKey, { userId: uid, count: sites.length });

    return NextResponse.json({ sites });
  } catch (error) {
    logger.error("GET /api/sites failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}, 'read');

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    logger.request('POST', '/api/sites', { userId: uid });

    const body = (await req.json()) as {
      domain?: string;
      siteName?: string;
      niche?: string;
      targetCountry?: string;
      language?: string;
      brandVoiceAdjectives?: string[];
      brandVoiceTone?: string;
      brandVoiceTargetAudience?: string;
      brandVoiceFormattingRules?: string;
    };

    if (!body.domain || !body.siteName || !body.niche) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const db = adminDb();
    const sites = db.collection("sites");

    // Check site limit
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const plan: PlanTier = (userData?.planTier as PlanTier) || 'free';
    const siteLimit = PLANS[plan].limits.siteConnections;

    const existingSitesCount = await sites
      .where("ownerId", "==", uid)
      .count()
      .get();

    if (existingSitesCount.data().count >= siteLimit) {
      return NextResponse.json(
        { 
          error: `You've reached your site limit (${siteLimit}). Upgrade to add more sites.`,
          limit: siteLimit,
          current: existingSitesCount.data().count,
        },
        { status: 403 }
      );
    }

    const now = new Date();

    logger.database('create', 'sites', { userId: uid });

    const docRef = await sites.add({
      ownerId: uid,
      domain: body.domain,
      siteName: body.siteName,
      niche: body.niche,
      targetCountry: body.targetCountry ?? "global",
      language: body.language ?? "en",
      brandVoice: {
        adjectives:
          body.brandVoiceAdjectives && body.brandVoiceAdjectives.length > 0
            ? body.brandVoiceAdjectives
            : ["neutral", "expert"],
        tone: body.brandVoiceTone || "",
        targetAudience: body.brandVoiceTargetAudience || "",
        formattingRules: body.brandVoiceFormattingRules || "",
      },
      createdAt: now,
      updatedAt: now,
    });

    // Invalidate cache
    await invalidateSiteCache(uid);

    return NextResponse.json(
      {
        siteId: docRef.id,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("POST /api/sites failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}, 'write');
