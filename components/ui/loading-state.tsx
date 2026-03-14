"use client";

import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const content = (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-2xl animate-pulse" />
        <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-orange-500 shadow-lg shadow-gold/30 p-4">
          <Sparkles className={cn(sizeClasses[size], "text-white animate-pulse")} />
        </div>
      </div>
      <p className={cn("font-medium text-text-2", textSizeClasses[size])}>
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        {content}
      </div>
    );
  }

  return content;
}

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-gold", sizeClasses[size], className)}
    />
  );
}

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-xl bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer",
            className
          )}
        />
      ))}
    </>
  );
}
