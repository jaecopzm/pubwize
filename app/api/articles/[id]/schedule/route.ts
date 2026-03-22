import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { scheduleArticle, unscheduleArticle } from '@/lib/services/content-calendar';
import { invalidateCalendarCache, invalidateArticleCache } from '@/lib/cache-invalidation';
import { withRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * POST /api/articles/[id]/schedule
 * Schedule an article for a specific date
 */
async function scheduleHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: articleId } = await params;
    const body = await request.json();
    const { scheduledDate } = body;

    if (!scheduledDate) {
      return NextResponse.json(
        { error: 'scheduledDate is required' },
        { status: 400 }
      );
    }

    const date = new Date(scheduledDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const db = adminDb();
    await scheduleArticle(db as any, articleId, userId, date);

    // Invalidate calendar and article caches
    await Promise.all([
      invalidateCalendarCache(userId),
      invalidateArticleCache(articleId, userId),
    ]);

    logger.info('Article scheduled', { articleId, userId, scheduledDate: date.toISOString() });

    return NextResponse.json({
      success: true,
      message: 'Article scheduled successfully',
      scheduledDate: date.toISOString(),
    });
  } catch (error) {
    console.error('Error scheduling article:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this article' },
        { status: 403 }
      );
    }
    
    if (errorMessage.includes('Cannot schedule')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to schedule article' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(scheduleHandler, 'write');

/**
 * DELETE /api/articles/[id]/schedule
 * Remove scheduled date from an article
 */
async function unscheduleHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: articleId } = await params;
    const db = adminDb();
    
    await unscheduleArticle(db as any, articleId, userId);

    // Invalidate calendar and article caches
    await Promise.all([
      invalidateCalendarCache(userId),
      invalidateArticleCache(articleId, userId),
    ]);

    logger.info('Article unscheduled', { articleId, userId });

    return NextResponse.json({
      success: true,
      message: 'Article unscheduled successfully',
    });
  } catch (error) {
    console.error('Error unscheduling article:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this article' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to unschedule article' },
      { status: 500 }
    );
  }
}

export const DELETE = withRateLimit(unscheduleHandler, 'write');
