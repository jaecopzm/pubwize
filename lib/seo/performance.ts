/**
 * Performance Optimization Utilities
 * Helpers for improving page speed and Core Web Vitals
 */

/**
 * Preload critical resources
 * Call this in page components to preload fonts, images, etc.
 */
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
}

/**
 * Prefetch next page
 * Call this when user hovers over a link
 */
export function prefetchPage(href: string) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(img: HTMLImageElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLImageElement;
        const src = target.dataset.src;
        if (src) {
          target.src = src;
          target.removeAttribute('data-src');
        }
        observer.unobserve(target);
      }
    });
  });
  
  observer.observe(img);
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Report Web Vitals to analytics
 * Use with Next.js reportWebVitals in _app.tsx
 */
export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to your analytics service
    // Example: Google Analytics
    // window.gtag?.('event', metric.name, {
    //   value: Math.round(metric.value),
    //   event_label: metric.id,
    //   non_interaction: true,
    // });
  }
}

/**
 * Optimize image loading with blur placeholder
 */
export function getImageProps(src: string, width: number, height: number) {
  return {
    src,
    width,
    height,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    // Add blur placeholder for better UX
    placeholder: 'blur' as const,
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Measure performance timing
 */
export function measurePerformance(name: string, fn: () => void) {
  if (typeof window === 'undefined') return fn();
  
  const start = performance.now();
  fn();
  const end = performance.now();
  
  console.log(`${name} took ${(end - start).toFixed(2)}ms`);
}

/**
 * Get Core Web Vitals
 */
export async function getCoreWebVitals() {
  if (typeof window === 'undefined') return null;
  
  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB } = await import('web-vitals');
    
    return {
      onCLS,
      onFID,
      onFCP,
      onLCP,
      onTTFB,
    };
  } catch (error) {
    console.error('Failed to load web-vitals:', error);
    return null;
  }
}
