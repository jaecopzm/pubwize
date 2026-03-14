/**
 * Resource Hints
 * Preload, prefetch, and preconnect for better performance
 */

/**
 * Preload critical resources
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'font' | 'image',
  options?: {
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }
) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;

  if (options?.type) {
    link.type = options.type;
  }

  if (options?.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * Prefetch resources for next navigation
 */
export function prefetchResource(href: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;

  document.head.appendChild(link);
}

/**
 * Preconnect to external domains
 */
export function preconnect(
  href: string,
  crossOrigin?: 'anonymous' | 'use-credentials'
) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;

  if (crossOrigin) {
    link.crossOrigin = crossOrigin;
  }

  document.head.appendChild(link);
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(href: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = href;

  document.head.appendChild(link);
}

/**
 * Preload critical fonts
 */
export function preloadFonts() {
  // Preload Manrope font
  preloadResource(
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
    'style'
  );
}

/**
 * Preconnect to external services
 */
export function preconnectExternalServices() {
  // Firebase
  preconnect('https://firestore.googleapis.com');
  preconnect('https://identitytoolkit.googleapis.com');

  // Google Fonts
  preconnect('https://fonts.googleapis.com');
  preconnect('https://fonts.gstatic.com', 'anonymous');

  // Unsplash (if used)
  dnsPrefetch('https://images.unsplash.com');
}

/**
 * Initialize resource hints
 */
export function initializeResourceHints() {
  if (typeof window === 'undefined') return;

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      preconnectExternalServices();
    });
  } else {
    preconnectExternalServices();
  }
}
