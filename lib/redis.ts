/**
 * Upstash Redis Client
 * Used for caching and rate limiting
 */

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different endpoints
export const rateLimiters = {
  // Strict limit for AI generation endpoints (expensive operations)
  aiGeneration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
    analytics: true,
    prefix: 'ratelimit:ai',
  }),

  // Moderate limit for research/keyword endpoints
  research: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'), // 30 requests per hour
    analytics: true,
    prefix: 'ratelimit:research',
  }),

  // Generous limit for read operations
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'ratelimit:read',
  }),

  // Moderate limit for write operations
  write: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'), // 50 requests per minute
    analytics: true,
    prefix: 'ratelimit:write',
  }),

  // Strict limit for WordPress publish (external API calls)
  wordpress: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 publishes per hour
    analytics: true,
    prefix: 'ratelimit:wordpress',
  }),

  // Very strict for auth endpoints (prevent brute force)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
};

// Cache helper functions
export const cache = {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get<T>(key);
      return data;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  /**
   * Set cached data with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis delPattern error:', error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  },

  /**
   * Set expiry on existing key
   */
  async expire(key: string, seconds: number): Promise<void> {
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  },
};

// Cache key generators
export const cacheKeys = {
  userPlan: (userId: string) => `user:${userId}:plan`,
  userUsage: (userId: string) => `user:${userId}:usage`,
  article: (articleId: string) => `article:${articleId}`,
  articles: (userId: string) => `articles:${userId}`,
  // single site cache (not user-specific, invalidated on write)
  site: (siteId: string) => `site:${siteId}`,
  sites: (userId: string) => `sites:${userId}`,
  wordpressSites: (userId: string) => `wordpress:${userId}:sites`,
  serpData: (keyword: string, country: string) => `serp:${keyword}:${country}`,
  keywordResearch: (query: string) => `research:${query}`,
  calendarEvents: (userId: string, year: number, month: number) =>
    `calendar:${userId}:${year}:${month}`,
};

// Cache TTLs (in seconds)
export const cacheTTL = {
  userPlan: 300, // 5 minutes
  userUsage: 60, // 1 minute
  article: 300, // 5 minutes
  site: 300, // 5 minutes (single site)
  articles: 60, // 1 minute
  sites: 300, // 5 minutes
  serpData: 86400, // 24 hours (SERP data changes slowly)
  keywordResearch: 3600, // 1 hour
  calendarEvents: 300, // 5 minutes
};
