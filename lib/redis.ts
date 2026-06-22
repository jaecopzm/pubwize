import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

function createRedisClient(): Redis {
  if (!hasRedis) {
    return null as any;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export const redis = createRedisClient();

function createNoopRateLimiter() {
  return {
    limit: async (_id: string) => ({ success: true, limit: 999, remaining: 999, reset: Date.now() + 60000 }),
  };
}

function createRateLimiter(requests: number, window: string) {
  if (!hasRedis || !redis) return createNoopRateLimiter();
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as any),
    analytics: true,
    prefix: 'ratelimit',
  });
}

export const rateLimiters = {
  aiGeneration: createRateLimiter(10, '1 h'),
  research: createRateLimiter(30, '1 h'),
  read: createRateLimiter(100, '1 m'),
  write: createRateLimiter(50, '1 m'),
  wordpress: createRateLimiter(20, '1 h'),
  auth: createRateLimiter(5, '15 m'),
};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!hasRedis || !redis) return null;
    try {
      return await redis.get<T>(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!hasRedis || !redis) return;
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    if (!hasRedis || !redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!hasRedis || !redis) return;
    try {
      let cursor = 0;
      const keysToDelete: string[] = [];
      do {
        const result = await redis.scan(cursor, { match: pattern, count: 100 });
        cursor = Number(result[0]);
        keysToDelete.push(...result[1]);
      } while (cursor !== 0);

      if (keysToDelete.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < keysToDelete.length; i += batchSize) {
          await redis.del(...keysToDelete.slice(i, i + batchSize));
        }
      }
    } catch (error) {
      console.error('Redis delPattern error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!hasRedis || !redis) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  async incr(key: string): Promise<number> {
    if (!hasRedis || !redis) return 0;
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (!hasRedis || !redis) return;
    try {
      await redis.expire(key, seconds);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  },
};

export const cacheKeys = {
  userPlan: (userId: string) => `user:${userId}:plan`,
  userUsage: (userId: string) => `user:${userId}:usage`,
  article: (articleId: string) => `article:${articleId}`,
  articles: (userId: string) => `articles:${userId}`,
  site: (siteId: string) => `site:${siteId}`,
  sites: (userId: string) => `sites:${userId}`,
  wordpressSites: (userId: string) => `wordpress:${userId}:sites`,
  serpData: (keyword: string, country: string) => `serp:${keyword}:${country}`,
  keywordResearch: (query: string) => `research:${query}`,
  calendarEvents: (userId: string, year: number, month: number) =>
    `calendar:${userId}:${year}:${month}`,
};

export const cacheTTL = {
  userPlan: 300,
  userUsage: 60,
  article: 300,
  site: 300,
  articles: 60,
  sites: 300,
  serpData: 86400,
  keywordResearch: 3600,
  calendarEvents: 300,
};
