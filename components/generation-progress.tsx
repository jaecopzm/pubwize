"use client";

import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stage {
  id: string;
  label: string;
  status: "pending" | "active" | "complete";
}

interface GenerationProgressProps {
  stages: Stage[];
  currentStage: number;
  estimatedTime?: number;
}

export function GenerationProgress({
  stages,
  currentStage,
  estimatedTime,
}: GenerationProgressProps) {
  const progress = (currentStage / stages.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#6366f1] to-[#22d3ee]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {stage.status === "complete" ? (
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : stage.status === "active" ? (
              <Loader2 className="h-5 w-5 text-[#6366f1] animate-spin flex-shrink-0" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                stage.status === "active" && "text-foreground",
                stage.status === "complete" && "text-muted-foreground line-through",
                stage.status === "pending" && "text-muted-foreground"
              )}
            >
              {stage.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Time estimate */}
      {estimatedTime && (
        <p className="text-xs text-muted-foreground text-center">
          Estimated time: ~{estimatedTime} seconds
        </p>
      )}
    </div>
  );
}
