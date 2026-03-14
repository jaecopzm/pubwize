# Robustness Features - Quick Reference Guide

## For Developers: How to Use the New Features

### 1. Adding Caching to an Endpoint

```typescript
import { cache, cacheKeys, cacheTTL } from '@/lib/redis';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const userId = 'user-id'; // Get from auth
  
  // 1. Check cache first
  const cacheKey = cacheKeys.articles(userId);
  const cached = await cache.get<any>(cacheKey);
  
  if (cached) {
    logger.cache('hit', cacheKey, { userId });
    return NextResponse.json(cached);
  }
  
  logger.cache('miss', cacheKey, { userId });
  
  // 2. Fetch from database
  const data = await fetchFromDatabase();
  
  // 3. Cache the result
  await cache.set(cacheKey, data, cacheTTL.articles);
  logger.cache('set', cacheKey, { userId });
  
  return NextResponse.json(data);
}
```

### 2. Adding Rate Limiting to an Endpoint

```typescript
import { withRateLimit } from '@/lib/rate-limit';

async function myHandler(request: NextRequest) {
  // Your handler logic
  return NextResponse.json({ success: true });
}

// Wrap with rate limiter
export const POST = withRateLimit(myHandler, 'write');
// Options: 'read', 'write', 'aiGeneration', 'research', 'wordpress', 'auth'
```

### 3. Invalidating Cache After Mutations

```typescript
import { invalidateArticleCache } from '@/lib/cache-invalidation';

export async function POST(request: NextRequest) {
  const userId = 'user-id';
  const articleId = 'article-id';
  
  // Update database
  await updateArticle(articleId, data);
  
  // Invalidate cache
  await invalidateArticleCache(articleId, userId);
  
  return NextResponse.json({ success: true });
}
```

### 4. Using Structured Logging

```typescript
import { logger } from '@/lib/logger';

// Log info
logger.info('User logged in', { userId: 'user-123' });

// Log errors
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, { userId: 'user-123' });
}

// Log API requests/responses
const startTime = Date.now();
// ... handle request ...
logger.response('POST', '/api/articles', 200, Date.now() - startTime);

// Log cache operations
logger.cache('hit', 'articles:user-123', { userId: 'user-123' });

// Log AI generation
logger.aiGeneration('article', 'gemini-pro', 1500, { articleId: 'abc' });
```

### 5. Adding Error Handling

```typescript
import { withErrorHandler, assertValid, NotFoundError } from '@/lib/error-handler';

async function myHandler(request: NextRequest) {
  // Validate input
  assertValid(articleId.length > 0, 'Article ID is required');
  
  // Check if exists
  if (!article) {
    throw new NotFoundError('Article');
  }
  
  return NextResponse.json({ success: true });
}

export const POST = withErrorHandler(myHandler);
```

## Common Patterns

### Pattern 1: Read Endpoint with Caching
```typescript
import { withRateLimit } from '@/lib/rate-limit';
import { cache, cacheKeys, cacheTTL } from '@/lib/redis';
import { logger } from '@/lib/logger';

async function getDataHandler(request: NextRequest) {
  const userId = getUserId(request);
  const cacheKey = cacheKeys.articles(userId);
  
  // Try cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    logger.cache('hit', cacheKey, { userId });
    return NextResponse.json(cached);
  }
  
  // Fetch from DB
  const data = await fetchData(userId);
  
  // Cache it
  await cache.set(cacheKey, data, cacheTTL.articles);
  
  return NextResponse.json(data);
}

export const GET = withRateLimit(getDataHandler, 'read');
```

### Pattern 2: Write Endpoint with Cache Invalidation
```typescript
import { withRateLimit } from '@/lib/rate-limit';
import { invalidateArticleCache } from '@/lib/cache-invalidation';
import { logger } from '@/lib/logger';

async function updateDataHandler(request: NextRequest) {
  const userId = getUserId(request);
  const articleId = getArticleId(request);
  
  // Update database
  await updateDatabase(articleId, data);
  
  // Invalidate cache
  await invalidateArticleCache(articleId, userId);
  
  logger.info('Article updated', { articleId, userId });
  
  return NextResponse.json({ success: true });
}

export const POST = withRateLimit(updateDataHandler, 'write');
```

### Pattern 3: Expensive Operation with Aggressive Caching
```typescript
import { withRateLimit } from '@/lib/rate-limit';
import { cache, cacheKeys, cacheTTL } from '@/lib/redis';

async function expensiveOperationHandler(request: NextRequest) {
  const query = getQuery(request);
  const cacheKey = cacheKeys.keywordResearch(query);
  
  // Check cache (1 hour TTL for expensive operations)
  const cached = await cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);
  
  // Expensive operation (SERP API, AI generation, etc.)
  const result = await expensiveOperation(query);
  
  // Cache for 1 hour
  await cache.set(cacheKey, result, cacheTTL.keywordResearch);
  
  return NextResponse.json(result);
}

export const POST = withRateLimit(expensiveOperationHandler, 'research');
```

## Cache Key Naming Convention

Use the provided cache key generators:
```typescript
cacheKeys.userPlan(userId)           // "user:123:plan"
cacheKeys.articles(userId)           // "articles:123"
cacheKeys.article(articleId)         // "article:abc"
cacheKeys.sites(userId)              // "sites:123"
cacheKeys.calendarEvents(userId, year, month) // "calendar:123:2024:3"
cacheKeys.keywordResearch(query)     // "research:keyword"
```

## Rate Limit Types

Choose the appropriate rate limiter:
- `'read'`: 100 req/min - For GET endpoints
- `'write'`: 50 req/min - For POST/PUT/DELETE endpoints
- `'aiGeneration'`: 10 req/hour - For AI generation endpoints
- `'research'`: 30 req/hour - For SERP/keyword research
- `'wordpress'`: 20 req/hour - For WordPress API calls
- `'auth'`: 5 req/15min - For authentication endpoints

## Cache TTLs

Use appropriate TTLs based on data freshness needs:
```typescript
cacheTTL.userPlan        // 5 minutes
cacheTTL.userUsage       // 1 minute
cacheTTL.article         // 5 minutes
cacheTTL.articles        // 1 minute
cacheTTL.sites           // 5 minutes
cacheTTL.serpData        // 24 hours
cacheTTL.keywordResearch // 1 hour
cacheTTL.calendarEvents  // 5 minutes
```

## Debugging

### Check if Redis is working
```typescript
import { redis } from '@/lib/redis';

// Test connection
await redis.ping(); // Should return "PONG"
```

### Check cache contents
```typescript
import { cache } from '@/lib/redis';

// Check if key exists
const exists = await cache.exists('articles:user-123');

// Get value
const value = await cache.get('articles:user-123');
console.log(value);
```

### Monitor rate limits
Rate limit headers are automatically added to responses:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Timestamp when limit resets

## Best Practices

1. **Always cache read operations** that are called frequently
2. **Invalidate cache immediately** after write operations
3. **Use appropriate TTLs** - shorter for frequently changing data
4. **Log cache operations** for debugging and monitoring
5. **Handle cache failures gracefully** - don't break the app if Redis is down
6. **Use rate limiting** on all public endpoints
7. **Add structured logging** for important operations
8. **Validate environment variables** on startup

## Troubleshooting

### Cache not working?
1. Check Redis connection in Upstash dashboard
2. Verify environment variables are set
3. Check logs for cache errors
4. Test with `redis.ping()`

### Rate limiting too strict?
1. Adjust limits in `lib/redis.ts`
2. Use different rate limiter type
3. Check rate limit headers in response

### Logs not showing?
1. Check `NODE_ENV` - debug logs only in development
2. Verify logger is imported correctly
3. Check console output format

## Migration Checklist

When adding robustness to an existing endpoint:

- [ ] Add caching for GET endpoints
- [ ] Add rate limiting with appropriate type
- [ ] Add cache invalidation for mutations
- [ ] Replace `console.log` with `logger` methods
- [ ] Add error handling with `withErrorHandler`
- [ ] Test cache hit/miss scenarios
- [ ] Test rate limiting behavior
- [ ] Update documentation
