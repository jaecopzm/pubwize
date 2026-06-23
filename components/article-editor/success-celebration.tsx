"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, Share2 } from "lucide-react";

interface SuccessCelebrationProps {
  show: boolean;
  wordCount: number;
  seoScore: number;
  timeTaken: string;
  onClose: () => void;
  onViewDraft: () => void;
}

export function SuccessCelebration({
  show,
  wordCount,
  seoScore,
  timeTaken,
  onClose,
  onViewDraft,
}: SuccessCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-obsidian/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-surface-1 p-6 shadow-2xl sm:p-8"
          >
            {/* Animated background glow */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" />

            <div className="relative z-10 text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 2] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-emerald-500"
                  />
                </div>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-black tracking-tight text-text-1 sm:text-3xl"
              >
                Article Complete! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8 text-sm text-text-3"
              >
                Your high-quality, SEO-optimized content is ready for publishing.
              </motion.p>

              <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Words" value={wordCount.toLocaleString()} color="indigo" delay={0.5} />
                <StatCard label="SEO Score" value={`${seoScore}/100`} color="emerald" delay={0.6} />
                <StatCard label="Time" value={timeTaken} color="gold" delay={0.7} />
                <StatCard label="Quality" value="High" color="teal" delay={0.8} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onViewDraft}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-3.5 text-sm font-bold text-text-1 hover:bg-white/10 transition-all active:scale-95"
                >
                  Edit Draft
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                  <Share2 className="h-4 w-4" />
                  Continue
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-400/5 border-indigo-400/10",
    emerald: "text-emerald-400 bg-emerald-400/5 border-emerald-400/10",
    gold: "text-gold bg-gold/5 border-gold/10",
    teal: "text-teal bg-teal/5 border-teal/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl border p-3 ${colors[color] || colors.indigo}`}
    >
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-sm font-black tabular-nums">{value}</p>
    </motion.div>
  );
}
