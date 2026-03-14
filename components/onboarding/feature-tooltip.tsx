/**
 * Feature Tooltip Component
 * Contextual tooltips for feature discovery
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureTooltipProps {
  id: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  onDismiss?: () => void;
  children: React.ReactNode;
}

export function FeatureTooltip({
  id,
  title,
  description,
  position = 'bottom',
  delay = 1000,
  onDismiss,
  children,
}: FeatureTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const storageKey = `pubwize_tooltip_${id}`;

  useEffect(() => {
    // Check if tooltip has been shown before
    const shown = localStorage.getItem(storageKey);
    if (shown === 'true') {
      setHasBeenShown(true);
      return;
    }

    // Show tooltip after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [storageKey, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasBeenShown(true);
    localStorage.setItem(storageKey, 'true');
    onDismiss?.();
  };

  if (hasBeenShown || !isVisible) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      {children}

      {/* Tooltip */}
      <div
        className={cn(
          'absolute z-50 w-64 sm:w-72 animate-slide-in-up',
          position === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
          position === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
          position === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
          position === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2'
        )}
      >
        <div className="bg-gradient-to-br from-[var(--gold)]/10 to-[var(--teal)]/10 backdrop-blur-xl border-2 border-[var(--gold)]/30 rounded-xl shadow-2xl p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[var(--gold)] to-[var(--teal)] rounded-lg flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[var(--text-1)] mb-1">
                {title}
              </h4>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                {description}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors touch-manipulation"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5 text-[var(--text-3)]" />
            </button>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-[var(--gold)] hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
          >
            Got it!
          </button>
        </div>

        {/* Arrow */}
        <div
          className={cn(
            'absolute w-3 h-3 bg-gradient-to-br from-[var(--gold)]/10 to-[var(--teal)]/10 border-[var(--gold)]/30 rotate-45',
            position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1.5 border-b-2 border-r-2',
            position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-t-2 border-l-2',
            position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1.5 border-t-2 border-r-2',
            position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1.5 border-b-2 border-l-2'
          )}
        />
      </div>
    </div>
  );
}
