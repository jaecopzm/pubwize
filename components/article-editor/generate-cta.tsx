"use client";

import { Loader2, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5 text-xs font-bold flex-1 text-emerald-500 shadow-sm shadow-emerald-500/10"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 shadow-inner">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
          </div>
          <span className="truncate tracking-tight uppercase">{doneLabel}</span>
        </motion.div>
        
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="group relative flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-4 py-2.5 text-xs font-bold text-indigo-400 transition-all hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 overflow-hidden sm:flex-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-400/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Sparkles className="h-3 w-3 shrink-0 relative z-10 group-hover:rotate-12 transition-transform" />
            <span className="relative z-10 tracking-tight uppercase">Regenerate</span>
          </button>
        )}
      </div>
    );

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "group relative w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 overflow-hidden shadow-xl",
        loading 
          ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 cursor-not-allowed shadow-none" 
          : "bg-indigo-600 border border-indigo-400/50 text-white hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:-translate-y-1 active:scale-95"
      )}
    >
      {!loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] animate-gradient-xy opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      
      {loading ? (
        <div className="flex items-center gap-2 relative z-10">
          <div className="relative">
            <Loader2 className="h-4 w-4 animate-spin" />
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-indigo-400/20 rounded-full"
            />
          </div>
          <span className="font-mono tracking-widest uppercase text-[10px]">Processing...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 relative z-10">
          <Zap className="h-4 w-4 fill-white group-hover:animate-pulse transition-all" />
          <span className="tracking-widest">{label}</span>
          <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
        </div>
      )}
    </button>
  );
}
