/**
 * Cache Invalidation Utilities
 * Centralized cache invalidation logic for data mutations
 */

import { cache, cacheKeys } from './redis';
import { logger } from './logger';

/**
 * Invalidate user-related caches
 */
export async function invalidateUserCache(userId: string) {
  try {
    await Promise.all([
      cache.del(cacheKeys.userPlan(userId)),
      cache.del(cacheKeys.userUsage(userId)),
      cache.del(cacheKeys.articles(userId)),
      cache.del(cacheKeys.sites(userId)),
      cache.del(cacheKeys.wordpressSites(userId)),
    ]);
    
    logger.cache('del', `user:${userId}:*`, { userId });
  } catch (error) {
    logger.error('Failed to invalidate user cache', error, { userId });
  }
}

/**
 * Invalidate article cache
 */
export async function invalidateArticleCache(articleId: string, userId: string) {
  try {
    await Promise.all([
      cache.del(cacheKeys.article(articleId)),
      cache.del(cacheKeys.articles(userId)),
    ]);
    
    logger.cache('del', `article:${articleId}`, { articleId, userId });
  } catch (error) {
    logger.error('Failed to invalidate article cache', error, { articleId, userId });
  }
}

/**
 * Invalidate articles list cache
 */
export async function invalidateArticlesCache(userId: string) {
  try {
    await cache.del(cacheKeys.articles(userId));
    logger.cache('del', cacheKeys.articles(userId), { userId });
  } catch (error) {
    logger.error('Failed to invalidate articles cache', error, { userId });
  }
}

/**
 * Invalidate site cache
 */
export async function invalidateSiteCache(userId: string) {
  try {
    await cache.del(cacheKeys.sites(userId));
    logger.cache('del', cacheKeys.sites(userId), { userId });
  } catch (error) {
    logger.error('Failed to invalidate site cache', error, { userId });
  }
}

/**
 * Invalidate WordPress sites cache
 */
export async function invalidateWordPressSitesCache(userId: string) {
  try {
    await cache.del(cacheKeys.wordpressSites(userId));
    logger.cache('del', cacheKeys.wordpressSites(userId), { userId });
  } catch (error) {
    logger.error('Failed to invalidate WordPress sites cache', error, { userId });
  }
}

/**
 * Invalidate calendar cache
 */
export async function invalidateCalendarCache(userId: string, year?: number, month?: number) {
  try {
    if (year && month) {
      // Invalidate specific month
      await cache.del(cacheKeys.calendarEvents(userId, year, month));
      logger.cache('del', cacheKeys.calendarEvents(userId, year, month), { userId, year, month });
    } else {
      // Invalidate all calendar data for user
      await cache.delPattern(`calendar:${userId}:*`);
      logger.cache('del', `calendar:${userId}:*`, { userId });
    }
  } catch (error) {
    logger.error('Failed to invalidate calendar cache', error, { userId, year, month });
  }
}

/**
 * Invalidate usage cache (call after usage updates)
 */
export async function invalidateUsageCache(userId: string) {
  try {
    await Promise.all([
      cache.del(cacheKeys.userUsage(userId)),
      cache.del(cacheKeys.userPlan(userId)), // Plan includes usage data
    ]);
    
    logger.cache('del', `usage:${userId}`, { userId });
  } catch (error) {
    logger.error('Failed to invalidate usage cache', error, { userId });
  }
}

/**
 * Invalidate all caches for a user (nuclear option)
 */
export async function invalidateAllUserCaches(userId: string) {
  try {
    await cache.delPattern(`*:${userId}:*`);
    logger.cache('del', `*:${userId}:*`, { userId });
  } catch (error) {
    logger.error('Failed to invalidate all user caches', error, { userId });
  }
}

/**
 * Warm up cache with fresh data
 * Call this after invalidation to pre-populate cache
 */
export async function warmUpCache(userId: string, data: {
  plan?: any;
  usage?: any;
  articles?: any[];
  sites?: any[];
}) {
  try {
    const promises: Promise<void>[] = [];

    if (data.plan) {
      promises.push(cache.set(cacheKeys.userPlan(userId), data.plan, 300));
    }

    if (data.usage) {
      promises.push(cache.set(cacheKeys.userUsage(userId), data.usage, 60));
    }

    if (data.articles) {
      promises.push(cache.set(cacheKeys.articles(userId), data.articles, 60));
    }

    if (data.sites) {
      promises.push(cache.set(cacheKeys.sites(userId), data.sites, 300));
    }

    await Promise.all(promises);
    logger.debug('Cache warmed up', { userId });
  } catch (error) {
    logger.error('Failed to warm up cache', error, { userId });
  }
}
