"use client";

import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface GenerateCTAProps {
  onClick: () => void;
  loading: boolean;
  done: boolean;
  label: string;
  doneLabel: string;
  onRegenerate?: () => void;
}

export function GenerateCTA({
  onClick,
  loading,
  done,
  label,
  doneLabel,
  onRegenerate,
}: GenerateCTAProps) {
  if (done)
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm font-semibold flex-1 text-teal">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{doneLabel}</span>
        </div>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="group relative flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm font-semibold text-gold transition-all hover:bg-gold/10 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/20 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 touch-manipulation overflow-hidden sm:flex-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Sparkles className="h-4 w-4 shrink-0 relative z-10 group-hover:rotate-12 transition-transform" />
            <span className="relative z-10">Regenerate</span>
          </button>
        )}
      </div>
    );

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group relative w-full flex items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold px-4 py-3 text-sm font-semibold text-obsidian transition-all hover:bg-gold/90 hover:shadow-xl hover:shadow-gold/30 hover:-translate-y-1 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 active:scale-95 active:translate-y-0 touch-manipulation overflow-hidden min-w-full"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin relative z-10" />
          <span className="relative z-10">Generating…</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 relative z-10 group-hover:rotate-12 group-hover:scale-110 transition-transform" />
          <span className="relative z-10">{label}</span>
        </>
      )}
    </button>
  );
}
