/**
 * Resource Hints Component
 * Preconnect to external services for faster loading
 */

'use client';

import { useEffect } from 'react';
import { initializeResourceHints } from '@/lib/performance/resource-hints';

export function ResourceHints() {
  useEffect(() => {
    // Initialize resource hints on mount
    initializeResourceHints();
  }, []);

  return null;
}
