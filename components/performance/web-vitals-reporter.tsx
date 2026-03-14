/**
 * Web Vitals Reporter Component
 * Reports Core Web Vitals metrics
 */

'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/performance/web-vitals';

export function WebVitalsReporter() {
  useEffect(() => {
    // Only load web-vitals in the browser
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(reportWebVitals);
        onFID(reportWebVitals);
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
        onINP(reportWebVitals);
      }).catch(console.error);
    }
  }, []);

  return null;
}
