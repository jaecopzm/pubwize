"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Globe, User, CheckCircle2 } from "lucide-react";

const EVENTS = [
  { name: "Alex G.", action: "published to WordPress", target: "SEO Strategy 2024", icon: Globe, color: "text-teal" },
  { name: "Sarah K.", action: "generated a brief for", target: "Digital Marketing", icon: Sparkles, color: "text-gold" },
  { name: "Mark M.", action: "reached SEO Score 98/100", target: "Eco-living", icon: CheckCircle2, color: "text-teal" },
  { name: "Jessica R.", action: "published to WordPress", target: "Crypto Guide", icon: Globe, color: "text-teal" },
  { name: "David L.", action: "scanned keywords for", target: "Fitness Blog", icon: Sparkles, color: "text-gold" },
];

export function SuccessFeed() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % EVENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const event = EVENTS[index];

  return (
    <div className="fixed bottom-6 left-6 z-[60] hidden md:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-surface-1/60 backdrop-blur-2xl shadow-2xl overflow-hidden relative min-w-[320px]"
        >
          {/* Animated Glow Line */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 5, ease: "linear", repeat: Infinity }}
            className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent"
          />

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 shadow-inner">
            <User className="h-5 w-5 text-muted-foreground/40" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-foreground">{event.name}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{event.action}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <event.icon className={`h-3 w-3 ${event.color}`} />
              <p className="text-[11px] font-bold text-foreground/80 truncate">"{event.target}"</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">Just now</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
