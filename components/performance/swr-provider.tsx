/**
 * SWR Provider
 * Global SWR configuration and provider
 */

'use client';

import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/hooks/use-swr-fetch';

interface SWRProviderProps {
  children: React.ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}
