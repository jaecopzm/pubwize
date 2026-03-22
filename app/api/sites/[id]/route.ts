import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore/collections';
import { cache, cacheKeys, cacheTTL } from '@/lib/redis';
import { invalidateSiteCache } from '@/lib/cache-invalidation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: siteId } = await params;
    const db = adminDb();
    const siteRef = db.collection(COLLECTIONS.SITES).doc(siteId);
    const siteDoc = await siteRef.get();

    if (!siteDoc.exists) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const site = siteDoc.data();
    if (site?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await siteRef.delete();

    // invalidate caches
    await cache.del(cacheKeys.site(siteId));
    await invalidateSiteCache(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
  }
}

// handle PATCH (update site)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: siteId } = await params;
    const body = (await request.json()) as {
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

    const db = adminDb();
    const siteRef = db.collection(COLLECTIONS.SITES).doc(siteId);
    const siteDoc = await siteRef.get();

    if (!siteDoc.exists) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const site = siteDoc.data();
    if (site?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: any = {};
    if (body.domain) updateData.domain = body.domain;
    if (body.siteName) updateData.siteName = body.siteName;
    if (body.niche) updateData.niche = body.niche;
    if (body.targetCountry) updateData.targetCountry = body.targetCountry;
    if (body.language) updateData.language = body.language;

    if (
      body.brandVoiceAdjectives ||
      body.brandVoiceTone ||
      body.brandVoiceTargetAudience ||
      body.brandVoiceFormattingRules
    ) {
      updateData['brandVoice'] = {
        ...site.brandVoice,
        adjectives: body.brandVoiceAdjectives && body.brandVoiceAdjectives.length > 0
          ? body.brandVoiceAdjectives
          : site.brandVoice?.adjectives || ['neutral', 'expert'],
        tone: body.brandVoiceTone ?? site.brandVoice?.tone ?? '',
        targetAudience: body.brandVoiceTargetAudience ?? site.brandVoice?.targetAudience ?? '',
        formattingRules: body.brandVoiceFormattingRules ?? site.brandVoice?.formattingRules ?? '',
      };
    }

    updateData.updatedAt = new Date();

    await siteRef.update(updateData);

    // invalidate single-site and list cache
    await cache.del(cacheKeys.site(siteId));
    await invalidateSiteCache(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}

// GET site details for the owner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: siteId } = await params;
    const db = adminDb();
    const cacheKey = cacheKeys.site(siteId);
    // try redis first
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ site: cached });
    }

    const siteRef = db.collection(COLLECTIONS.SITES).doc(siteId);
    const siteDoc = await siteRef.get();

    if (!siteDoc.exists) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const site = siteDoc.data();
    if (site?.ownerId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // cache result
    await cache.set(cacheKey, site, cacheTTL.site);
    return NextResponse.json({ site });
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json({ error: 'Failed to fetch site' }, { status: 500 });
  }
}
