"use client";

import { motion } from "framer-motion";
import { Clock, Zap, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export function BeforeAfter() {
  const data = [
    { label: "Research & Planning", before: 45, after: 2, desc: "SERP & LSI" },
    { label: "Content Outlining", before: 30, after: 1, desc: "H1, H2s & Questions" },
    { label: "First Draft", before: 180, after: 5, desc: "2,500+ Words" },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-gradient-to-br from-gold/5 via-transparent to-teal/5 blur-[100px] pointer-events-none" />

      <div className="text-center mb-8 sm:mb-12 relative z-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display tracking-tight mb-3">
          The <span className="text-muted-foreground/40 italic">Old</span> Way vs. The <span className="gradient-gold-teal">Pubwize</span> Way
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          We optimized the entire SEO workflow so you can scale 10x faster.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative z-10">
        <div className="space-y-5">
          {data.map((item, i) => (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-xs font-black text-foreground">{item.label}</h4>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-teal">Save {item.before - item.after}m</span>
              </div>
              
              <div className="relative h-9 bg-white/5 rounded-xl border border-white/5 overflow-hidden flex items-center">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: i * 0.15 }}
                  className="absolute inset-y-0 left-0 bg-muted/20 opacity-30"
                />
                <div className="absolute left-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground">{item.before}m <span className="font-normal opacity-50">(Manual)</span></span>
                </div>

                <motion.div
                   initial={{ width: 0 }}
                   whileInView={{ width: `${(item.after / item.before) * 100}%` }}
                   transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: "circOut" }}
                   className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-teal rounded-r-xl shadow-[0_0_15px_rgba(245,166,35,0.3)] z-10"
                />
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="absolute right-3 z-20 flex items-center gap-1.5"
                >
                  <Zap className="h-3 w-3 text-gold fill-gold" />
                  <span className="text-[10px] font-black text-gold">{item.after}m</span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-3">
              <div className="h-8 w-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-500/60" />
              </div>
              <h3 className="text-sm font-black text-foreground">Traditional</h3>
              <ul className="space-y-2">
                {["4-6 hours per post", "Manual research", "Formatting pain", "SEO afterthought"].map(text => (
                  <li key={text} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-red-500/30 mt-1 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
           </div>

           <div className="p-5 rounded-2xl border border-gold/30 bg-gold/5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-gold/10 blur-[40px] pointer-events-none animate-pulse" />
              <div className="h-8 w-8 rounded-xl bg-gold/20 flex items-center justify-center border border-gold/30 shadow-lg shadow-gold/20">
                <TrendingUp className="h-4 w-4 text-gold" />
              </div>
              <h3 className="text-sm font-black text-foreground">Pubwize</h3>
              <ul className="space-y-2">
                {["Draft in 8 minutes", "AI SERP analysis", "1-Click WP Publish", "SEO Score built-in"].map(text => (
                  <li key={text} className="flex items-start gap-1.5 text-[10px] text-foreground/80 font-bold">
                    <CheckCircle2 className="h-3 w-3 text-teal mt-0.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>
    </section>
  );
}
