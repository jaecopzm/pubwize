"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SectionRegenerateProps {
  sectionHeading: string;
  sectionContent: string;
  keyword: string;
  onRegenerate: (newContent: string) => void;
  onUpgradeRequired?: (reason: string) => void;
}

export function SectionRegenerate({
  sectionHeading,
  sectionContent,
  keyword,
  onRegenerate,
  onUpgradeRequired,
}: SectionRegenerateProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);

    try {
      const response = await fetch('/api/articles/regenerate-section', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionHeading,
          sectionContent,
          keyword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired && onUpgradeRequired) {
          onUpgradeRequired(data.error || 'Upgrade required to continue');
          return;
        }
        throw new Error(data.error || 'Failed to regenerate section');
      }

      onRegenerate(data.newContent);
      toast.success('Section regenerated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate section');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <button
      onClick={handleRegenerate}
      disabled={isRegenerating}
      className="group relative inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal/5 px-2 py-1 text-[10px] sm:text-xs font-semibold text-teal transition-all hover:bg-teal/10 hover:border-teal/50 hover:shadow-lg hover:shadow-teal/10 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 overflow-hidden"
      title="Regenerate this section with AI"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-teal/0 via-teal/10 to-teal/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      {isRegenerating ? (
        <Loader2 className="h-3 w-3 animate-spin relative z-10" />
      ) : (
        <RefreshCw className="h-3 w-3 relative z-10 group-hover:rotate-180 transition-transform duration-500" />
      )}
      <span className="relative z-10">Regenerate</span>
    </button>
  );
}
