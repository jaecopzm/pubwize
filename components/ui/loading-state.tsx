"use client";

import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const content = (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.05, 0.2] 
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-primary blur-xl"
        />
        
        <div className="relative flex items-center justify-center rounded-xl bg-card border border-primary/20 shadow-xl backdrop-blur-xl p-3 sm:p-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-cyan-500/5 to-violet-500/5"
          />
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className={cn(sizeClasses[size], "text-primary drop-shadow-md")} />
          </motion.div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-1">
        <p className={cn("font-black tracking-tight text-foreground uppercase", textSizeClasses[size])}>
          {message}
        </p>
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="h-1 w-1 rounded-full bg-primary/40"
            />
          ))}
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
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
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  return (
    <div className="relative flex items-center justify-center">
      <Loader2
        className={cn("animate-spin text-primary opacity-80", sizeClasses[size], className)}
      />
      <motion.div
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={cn("absolute inset-0 bg-primary/20 blur-md rounded-full", sizeClasses[size])}
      />
    </div>
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
            "rounded-lg bg-muted/30 relative overflow-hidden",
            className
          )}
        >
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          />
        </div>
      ))}
    </>
  );
}
