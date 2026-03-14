# Frontend Performance Guide

Complete guide to frontend performance optimizations in Pubwize.

## Table of Contents
1. [Overview](#overview)
2. [SWR Data Fetching](#swr-data-fetching)
3. [Code Splitting](#code-splitting)
4. [Web Vitals Monitoring](#web-vitals-monitoring)
5. [Resource Hints](#resource-hints)
6. [Request Deduplication](#request-deduplication)
7. [Image Optimization](#image-optimization)
8. [Best Practices](#best-practices)

---

## Overview

Our frontend performance strategy focuses on:
- **Fast Initial Load**: Code splitting and resource hints
- **Efficient Data Fetching**: SWR with caching and deduplication
- **Smooth Interactions**: Optimistic updates and transitions
- **Monitoring**: Web Vitals tracking

### Key Metrics
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms

---

## SWR Data Fetching

### What is SWR?

SWR (stale-while-revalidate) is a React Hooks library for data fetching that:
- Returns cached data first (stale)
- Fetches fresh data in background (revalidate)
- Updates UI when new data arrives

### Available Hooks

```typescript
import {
  useArticles,
  useArticle,
  useSites,
  useUserPlan,
  useCalendarEvents,
  useWordPressSites,
} from '@/lib/hooks/use-swr-fetch';
```

### Usage Examples

#### Fetch Articles List
```typescript
function ArticlesList() {
  const { articles, isLoading, isError, mutate } = useArticles();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;

  return (
    <div>
      {articles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

#### Fetch Single Article
```typescript
function ArticleEditor({ articleId }: { articleId: string }) {
  const { article, isLoading, mutate } = useArticle(articleId);

  const handleSave = async (updates: Partial<Article>) => {
    // Optimistic update
    mutate({ ...article, ...updates }, false);

    // Save to API
    await fetch(`/api/articles/${articleId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    // Revalidate
    mutate();
  };

  return <Editor article={article} onSave={handleSave} />;
}
```

#### Fetch User Plan with Auto-Refresh
```typescript
function UsageMeter() {
  const { plan, usage, isLoading } = useUserPlan();
  // Auto-refreshes every 60 seconds

  return (
    <div>
      <p>Plan: {plan}</p>
      <p>Usage: {usage.articlesGenerated} / {usage.limit}</p>
    </div>
  );
}
```

### Prefetching

Prefetch data before navigation for instant page loads:

```typescript
import { prefetchArticles, prefetchSites } from '@/lib/hooks/use-swr-fetch';

function Navigation() {
  return (
    <Link
      href="/dashboard/articles"
      onMouseEnter={() => prefetchArticles()}
    >
      Articles
    </Link>
  );
}
```

### Manual Revalidation

Trigger data refresh manually:

```typescript
function ArticleActions() {
  const { mutate } = useArticles();

  const handleDelete = async (id: string) => {
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    mutate(); // Refresh articles list
  };

  return <button onClick={() => handleDelete('123')}>Delete</button>;
}
```

### Configuration

Global SWR config in `components/performance/swr-provider.tsx`:

```typescript
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,      // Don't refetch on window focus
  revalidateOnReconnect: true,   // Refetch on reconnect
  dedupingInterval: 2000,        // Dedupe requests within 2s
  errorRetryCount: 3,            // Retry failed requests 3 times
  errorRetryInterval: 5000,      // Wait 5s between retries
  shouldRetryOnError: true,      // Retry on error
  keepPreviousData: true,        // Keep old data while fetching
};
```

---

## Code Splitting

### Dynamic Imports

Heavy components are loaded on-demand to reduce initial bundle size.

### Available Dynamic Components

```typescript
import {
  ArticleEditor,
  WordPressPublishPanel,
  VersionHistoryPanel,
  ImageRecommendations,
  AIImprovePanel,
  PricingCards,
  Calendar,
} from '@/lib/performance/code-splitting';
```

### Usage

```typescript
// Instead of:
import ArticleEditor from '@/components/article-editor/article-editor';

// Use:
import { ArticleEditor } from '@/lib/performance/code-splitting';

function ArticlePage() {
  return <ArticleEditor articleId="123" />;
}
```

### Custom Dynamic Components

Create your own dynamic components:

```typescript
import { createDynamicComponent } from '@/lib/performance/code-splitting';

const HeavyChart = createDynamicComponent(
  () => import('@/components/charts/heavy-chart'),
  { ssr: false } // Disable SSR for client-only components
);
```

### Prefetching Components

Prefetch components before user needs them:

```typescript
import { prefetchComponent } from '@/lib/performance/code-splitting';

function Dashboard() {
  useEffect(() => {
    // Prefetch article editor on dashboard load
    prefetchComponent(() => import('@/components/article-editor/article-editor'));
  }, []);

  return <DashboardContent />;
}
```

---

## Web Vitals Monitoring

### Automatic Tracking

Web Vitals are automatically tracked and reported in the root layout.

### Metrics Tracked

1. **LCP (Largest Contentful Paint)**: Loading performance
2. **FID (First Input Delay)**: Interactivity
3. **CLS (Cumulative Layout Shift)**: Visual stability
4. **FCP (First Contentful Paint)**: Initial render
5. **TTFB (Time to First Byte)**: Server response
6. **INP (Interaction to Next Paint)**: Responsiveness

### Development Monitoring

In development, metrics are logged to console:

```
📊 Web Vital: { name: 'LCP', value: 1234, rating: 'good' }
```

### Production Analytics

To send metrics to analytics in production, update `lib/performance/web-vitals.ts`:

```typescript
export function reportWebVitals(metric: WebVitalsMetric) {
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics
    window.gtag?.('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });

    // Or custom endpoint
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  }
}
```

### Thresholds

```typescript
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};
```

---

## Resource Hints

### Automatic Preconnections

External services are preconnected automatically on page load:

- Firebase (Firestore, Auth)
- Google Fonts
- Unsplash (DNS prefetch)

### Manual Resource Hints

```typescript
import {
  preloadResource,
  prefetchResource,
  preconnect,
  dnsPrefetch,
} from '@/lib/performance/resource-hints';

// Preload critical resources
preloadResource('/fonts/custom-font.woff2', 'font', {
  type: 'font/woff2',
  crossOrigin: 'anonymous',
});

// Prefetch next page
prefetchResource('/dashboard/articles');

// Preconnect to API
preconnect('https://api.example.com');

// DNS prefetch for images
dnsPrefetch('https://cdn.example.com');
```

### Font Preloading

Fonts are automatically preloaded in the resource hints initializer.

---

## Request Deduplication

### Automatic Deduplication

Duplicate API requests within 5 seconds are automatically deduplicated.

### How It Works

```typescript
// Multiple components request same data
useArticle('123'); // Request sent
useArticle('123'); // Uses cached promise (within 5s)
useArticle('123'); // Uses cached promise (within 5s)
```

### Manual Deduplication

```typescript
import { deduplicateRequest } from '@/lib/performance/request-deduplication';

const fetchArticle = deduplicateRequest(async (id: string) => {
  const response = await fetch(`/api/articles/${id}`);
  return response.json();
});

// Multiple calls return same promise
const article1 = await fetchArticle('123');
const article2 = await fetchArticle('123'); // Same promise
```

---

## Image Optimization

### Optimized Image Component

```typescript
import { OptimizedImage } from '@/components/performance/image-loader';

function ArticleCard({ article }: { article: Article }) {
  return (
    <OptimizedImage
      src={article.featuredImage}
      alt={article.title}
      width={800}
      height={600}
      priority={false} // Set true for above-fold images
    />
  );
}
```

### Features

- Lazy loading with Intersection Observer
- Blur placeholder while loading
- Automatic format optimization (WebP)
- Responsive images with srcset
- Priority loading for above-fold images

### Next.js Image Component

For most cases, use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Above-fold images
  placeholder="blur"
  blurDataURL="data:image/..." // Optional blur placeholder
/>
```

---

## Best Practices

### 1. Data Fetching

✅ **Do:**
- Use SWR hooks for all API calls
- Prefetch data on hover/focus
- Use optimistic updates for instant feedback
- Cache data with appropriate TTL

❌ **Don't:**
- Fetch same data multiple times
- Block rendering on data fetching
- Forget to handle loading/error states

### 2. Code Splitting

✅ **Do:**
- Dynamically import heavy components
- Split routes with Next.js automatic code splitting
- Prefetch components before navigation
- Use loading states for dynamic imports

❌ **Don't:**
- Import heavy libraries in every component
- Load all components upfront
- Forget SSR considerations

### 3. Performance Monitoring

✅ **Do:**
- Monitor Web Vitals in production
- Set up alerts for performance regressions
- Track metrics over time
- Test on real devices

❌ **Don't:**
- Ignore performance metrics
- Only test on fast connections
- Forget mobile performance

### 4. Images

✅ **Do:**
- Use Next.js Image component
- Lazy load below-fold images
- Provide width/height to prevent CLS
- Use appropriate formats (WebP)

❌ **Don't:**
- Load full-size images for thumbnails
- Forget alt text
- Use unoptimized images

### 5. Bundle Size

✅ **Do:**
- Analyze bundle with `npm run build`
- Remove unused dependencies
- Use tree-shaking
- Split vendor bundles

❌ **Don't:**
- Import entire libraries for one function
- Include dev dependencies in production
- Ignore bundle size warnings

---

## Performance Checklist

### Initial Load
- [ ] Code splitting implemented
- [ ] Critical CSS inlined
- [ ] Fonts preloaded
- [ ] External services preconnected
- [ ] Images optimized

### Data Fetching
- [ ] SWR hooks used
- [ ] Request deduplication enabled
- [ ] Caching configured
- [ ] Prefetching on navigation

### Runtime Performance
- [ ] Web Vitals monitored
- [ ] Smooth animations (60fps)
- [ ] No layout shifts
- [ ] Fast interactions (<100ms)

### Monitoring
- [ ] Analytics integrated
- [ ] Error tracking setup
- [ ] Performance budgets set
- [ ] Regular audits scheduled

---

## Troubleshooting

### Slow Initial Load

1. Check bundle size: `npm run build`
2. Verify code splitting is working
3. Check network waterfall in DevTools
4. Ensure resource hints are active

### Slow Data Fetching

1. Check API response times
2. Verify caching is working
3. Check request deduplication
4. Review SWR configuration

### Poor Web Vitals

1. **High LCP**: Optimize images, reduce bundle size
2. **High FID**: Reduce JavaScript execution time
3. **High CLS**: Set image dimensions, avoid dynamic content
4. **High TTFB**: Optimize server response time

### Memory Leaks

1. Check for uncleaned event listeners
2. Verify SWR cache isn't growing indefinitely
3. Review dynamic imports cleanup
4. Use React DevTools Profiler

---

## Next Steps

1. **Install Dependencies**:
   ```bash
   npm install swr web-vitals
   ```

2. **Test Performance**:
   - Run Lighthouse audit
   - Test on slow 3G
   - Check mobile performance

3. **Monitor in Production**:
   - Set up analytics
   - Configure alerts
   - Review metrics weekly

4. **Continuous Optimization**:
   - Regular bundle analysis
   - Performance budgets
   - A/B testing optimizations

---

## Resources

- [SWR Documentation](https://swr.vercel.app/)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
