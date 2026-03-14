/**
 * Code Splitting Utilities
 * Dynamic imports for better performance
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Loading component for dynamic imports
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--gold)] border-t-transparent" />
    </div>
  );
}

/**
 * Error component for dynamic imports
 */
export function LoadingError({ error }: { error: Error }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-red-500">Failed to load component</p>
      <p className="text-xs text-[var(--text-3)] mt-2">{error.message}</p>
    </div>
  );
}

/**
 * Create dynamic component with loading state
 */
export function createDynamicComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: () => React.ReactElement;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || LoadingSpinner,
    ssr: options?.ssr ?? true,
  });
}

/**
 * Lazy load heavy components
 */

// Note: These components need to be refactored to use default exports
// For now, import them directly instead of using dynamic imports

// Article Editor (heavy with TipTap)
// export const ArticleEditor = createDynamicComponent(
//   () => import('@/components/article-editor/article-editor'),
//   { ssr: false }
// );

// WordPress Publish Panel
// export const WordPressPublishPanel = createDynamicComponent(
//   () => import('@/components/wordpress/wordpress-publish-panel'),
//   { ssr: false }
// );

// Version History Panel
// export const VersionHistoryPanel = createDynamicComponent(
//   () => import('@/components/version-history/version-history-panel'),
//   { ssr: false }
// );

// Image Recommendations
// export const ImageRecommendations = createDynamicComponent(
//   () => import('@/components/article-editor/image-recommendations'),
//   { ssr: false }
// );

// AI Improve Panel
// export const AIImprovePanel = createDynamicComponent(
//   () => import('@/components/article-editor/ai-improve-panel'),
//   { ssr: false }
// );

// Pricing Cards (heavy with animations)
// export const PricingCards = createDynamicComponent(
//   () => import('@/components/pricing/pricing-cards'),
//   { ssr: true }
// );

// Calendar (heavy with date-fns)
// export const Calendar = createDynamicComponent(
//   () => import('@/components/ui/calendar'),
//   { ssr: false }
// );

/**
 * Prefetch component for faster navigation
 */
export function prefetchComponent(
  importFn: () => Promise<any>
): void {
  if (typeof window !== 'undefined') {
    // Prefetch on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn().catch(console.error);
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        importFn().catch(console.error);
      }, 1);
    }
  }
}
