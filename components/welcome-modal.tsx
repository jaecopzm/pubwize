"use client";

import { X, Sparkles, FileText, Zap, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURES = [
  { icon: FileText, label: "5 articles / month", sub: "Full AI workflow: Brief → Outline → Draft → SEO", color: "text-cyan-500", bg: "bg-cyan-500/10 dark:bg-cyan-500/10" },
  { icon: Zap,      label: "10 AI improvements", sub: "Polish your content with AI suggestions",          color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: Globe,    label: "1 site connection",   sub: "Brand voice, WordPress publishing",               color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60" />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-background overflow-hidden"
          >
            {/* Accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-primary via-cyan-400 to-violet-500" />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground leading-tight">Welcome to PubWize</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">You're on the Free plan</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-4">
                {FEATURES.map(({ icon: Icon, label, sub, color, bg }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border bg-muted/40 py-2.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Explore
                </button>
                <button
                  onClick={() => { onClose(); router.push("/dashboard/sites/new"); }}
                  className="flex-[2] rounded-lg bg-primary py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  Create First Site
                </button>
              </div>

              <p className="mt-3 text-center text-[10px] text-muted-foreground/60">
                Need more?{" "}
                <button onClick={() => { onClose(); router.push("/dashboard/settings?tab=billing"); }} className="text-primary hover:underline">
                  Upgrade for 25 articles/month
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
