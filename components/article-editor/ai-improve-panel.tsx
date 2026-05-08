"use client";

import { useState } from "react";
import { Sparkles, Zap, Target, BookOpen, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AIImprovePanelProps {
  content: string;
  keyword: string;
  onContentUpdate: (newContent: string) => void;
  onUpgradeRequired?: (reason: string) => void;
}

export function AIImprovePanel({ content, keyword, onContentUpdate, onUpgradeRequired }: AIImprovePanelProps) {
  const [improving, setImproving] = useState<string | null>(null);

  const improvements = [
    {
      id: "readability",
      label: "Improve Readability",
      description: "Make sentences shorter and easier to read",
      icon: BookOpen,
      color: "teal",
    },
    {
      id: "keyword",
      label: "Boost Keyword",
      description: "Naturally add more keyword mentions",
      icon: Target,
      color: "gold",
    },
    {
      id: "seo",
      label: "SEO Enhance",
      description: "Add headings, lists, and structure",
      icon: TrendingUp,
      color: "lilac",
    },
  ];

  const handleImprove = async (type: string) => {
    setImproving(type);
    
    try {
      const response = await fetch('/api/articles/ai-improve', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, keyword, improvementType: type }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired && onUpgradeRequired) {
          onUpgradeRequired(data.error || 'Upgrade required to continue');
          return;
        }
        throw new Error(data.error || 'Failed to improve content');
      }

      onContentUpdate(data.improvedContent);
      toast.success('Content improved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to improve content');
    } finally {
      setImproving(null);
    }
  };

  return (
    <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-gold" />
        <h3 className="text-xs sm:text-sm font-semibold font-mono-dm text-text-1">
          AI Improvements
        </h3>
      </div>
      <p className="text-[10px] sm:text-xs text-text-3 mb-3">
        Use AI to enhance specific aspects of your content
      </p>
      <div className="grid grid-cols-3 gap-2">
        {improvements.map((improvement) => {
          const Icon = improvement.icon;
          const isLoading = improving === improvement.id;
          
          return (
            <button
              key={improvement.id}
              onClick={() => handleImprove(improvement.id)}
              disabled={improving !== null}
              className={`group relative flex flex-col items-start gap-1.5 rounded-lg border p-2.5 sm:p-3 text-left transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden ${
                improvement.color === 'gold'
                  ? 'border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10'
                  : improvement.color === 'teal'
                  ? 'border-teal/30 bg-teal/5 hover:bg-teal/10 hover:border-teal/50 hover:shadow-lg hover:shadow-teal/10'
                  : 'border-lilac/30 bg-lilac/5 hover:bg-lilac/10 hover:border-lilac/50 hover:shadow-lg hover:shadow-lilac/10'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ${
                improvement.color === 'gold'
                  ? 'from-gold/0 via-gold/10 to-gold/0'
                  : improvement.color === 'teal'
                  ? 'from-teal/0 via-teal/10 to-teal/0'
                  : 'from-lilac/0 via-lilac/10 to-lilac/0'
              }`} />
              <div className="flex items-center gap-1.5 w-full relative z-10">
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-text-2" />
                ) : (
                  <Icon className={`h-3.5 w-3.5 group-hover:scale-110 transition-transform ${
                    improvement.color === 'gold'
                      ? 'text-gold'
                      : improvement.color === 'teal'
                      ? 'text-teal'
                      : 'text-lilac'
                  }`} />
                )}
                <span className="text-[10px] sm:text-xs font-semibold text-text-1">
                  {improvement.label}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-text-3 relative z-10">
                {improvement.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
