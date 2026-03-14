/**
 * Optimized Image Component
 * Lazy loading with blur placeholder
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  onLoad,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
        />
      )}
    </div>
  );
}
