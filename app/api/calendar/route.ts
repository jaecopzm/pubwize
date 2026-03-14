import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/lib/firestore/collections';
import { withRateLimit } from '@/lib/rate-limit';
import { cache, cacheKeys, cacheTTL } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * GET /api/calendar?year=2024&month=1
 * Get calendar events for a specific month
 */
async function getCalendarHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'year and month query parameters are required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = cacheKeys.calendarEvents(userId, yearNum, monthNum);
    const cached = await cache.get<any>(cacheKey);
    
    if (cached) {
      logger.cache('hit', cacheKey, { userId, year: yearNum, month: monthNum });
      logger.response('GET', '/api/calendar', 200, Date.now() - startTime, { cached: true });
      return NextResponse.json(cached);
    }

    logger.cache('miss', cacheKey, { userId, year: yearNum, month: monthNum });

    const db = adminDb();
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    const articlesRef = db.collection(COLLECTIONS.ARTICLES);
    const q = articlesRef
      .where('ownerId', '==', userId)
      .where('scheduledDate', '>=', startDate)
      .where('scheduledDate', '<=', endDate);

    const snapshot = await q.get();
    
    const events = snapshot.docs.map((doc) => {
      const data = doc.data();
      const scheduledTimestamp = data.scheduledDate;
      
      return {
        id: doc.id,
        articleId: doc.id,
        title: data.keyword || 'Untitled Article',
        status: data.status,
        authorId: data.ownerId,
        authorName: 'Author',
        scheduledDate: scheduledTimestamp?.toDate() || new Date(),
      };
    });

    const result = {
      events,
      year: yearNum,
      month: monthNum,
    };

    // Cache the result
    await cache.set(cacheKey, result, cacheTTL.calendarEvents);
    logger.cache('set', cacheKey, { userId, year: yearNum, month: monthNum });

    logger.response('GET', '/api/calendar', 200, Date.now() - startTime);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching calendar events', error, { userId: 'unknown' });
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(getCalendarHandler, 'read');
