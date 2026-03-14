"use client";

import { useState } from "react";
import { Brain, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SmartRegenerateProps {
  articleId: string;
  onRegenerate: (preferences: RegeneratePreferences) => void;
}

export interface RegeneratePreferences {
  titleStyle?: 'clickbait' | 'numbers' | 'year' | 'current';
  tone?: 'casual' | 'professional' | 'enthusiastic';
  length?: 'shorter' | 'longer' | 'same';
}

export function SmartRegenerate({ articleId, onRegenerate }: SmartRegenerateProps) {
  const [show, setShow] = useState(false);
  const [preferences, setPreferences] = useState<RegeneratePreferences>({
    titleStyle: 'current',
    tone: 'professional',
    length: 'same',
  });

  const handleRegenerate = () => {
    onRegenerate(preferences);
    setShow(false);
    toast.success("Regenerating with your preferences...");
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-2 text-sm font-semibold text-violet-400 transition-colors hover:bg-violet-500/10"
      >
        <Brain className="h-4 w-4" />
        Smart Regenerate
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-400" />
          <h3 className="text-sm font-semibold text-foreground">Smart Regenerate</h3>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-6 text-xs text-muted-foreground">
        AI learns from your edits. Customize the regeneration:
      </p>

      <div className="space-y-4">
        {/* Title Style */}
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">
            Title Style
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'current', label: 'Keep Current' },
              { value: 'clickbait', label: 'More Clickbait-y' },
              { value: 'numbers', label: 'Add Numbers' },
              { value: 'year', label: 'Include 2026' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences(p => ({ ...p, titleStyle: option.value as any }))}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  preferences.titleStyle === option.value
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                    : "border-border/60 bg-card text-muted-foreground hover:border-violet-500/30"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">
            Tone
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'casual', label: 'Casual' },
              { value: 'professional', label: 'Professional' },
              { value: 'enthusiastic', label: 'Enthusiastic' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences(p => ({ ...p, tone: option.value as any }))}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  preferences.tone === option.value
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                    : "border-border/60 bg-card text-muted-foreground hover:border-violet-500/30"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">
            Article Length
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'shorter', label: 'Shorter' },
              { value: 'same', label: 'Same' },
              { value: 'longer', label: 'Longer' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPreferences(p => ({ ...p, length: option.value as any }))}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  preferences.length === option.value
                    ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                    : "border-border/60 bg-card text-muted-foreground hover:border-violet-500/30"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleRegenerate}
        className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
      >
        Regenerate with Preferences
      </button>
    </div>
  );
}
