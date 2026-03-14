"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Layout, Zap, CheckCircle2, Search, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroDemo() {
  const [step, setStep] = useState(0);
  const [keyword, setKeyword] = useState("");
  const fullKeyword = "best eco-friendly sneakers 2026";

  // Simulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Sync keyword typing with step 0
  useEffect(() => {
    if (step === 0) {
      setKeyword("");
      let i = 0;
      const typeTimer = setInterval(() => {
        setKeyword(fullKeyword.slice(0, i));
        i++;
        if (i > fullKeyword.length) clearInterval(typeTimer);
      }, 60);
      return () => clearInterval(typeTimer);
    }
  }, [step]);

  const stages = [
    { title: "Keyword Research", icon: Search, color: "text-gold", bg: "bg-gold/10", desc: "Analyzing SERP" },
    { title: "SEO Brief", icon: FileText, color: "text-teal", bg: "bg-teal/10", desc: "Extracting entities" },
    { title: "Smart Outline", icon: Layout, color: "text-lilac", bg: "bg-lilac/10", desc: "Building structure" },
    { title: "AI Draft", icon: Zap, color: "text-gold", bg: "bg-gold/10", desc: "Writing content" },
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-12 sm:mt-16 group">
      {/* Decorative Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-gold/10 via-lilac/5 to-teal/10 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative rounded-[2rem] border border-white/10 bg-surface-1/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Browser Top Bar */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-amber-500/20" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
          </div>
          <div className="mx-auto bg-white/5 rounded-lg px-4 py-1 text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
            app.pubwize.com/generate
          </div>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[400px]">
          {/* Left Panel: Input & Status */}
          <div className="w-full lg:w-1/3 p-6 sm:p-8 border-r border-white/5">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Target Keyword</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gold">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-foreground min-h-[46px] flex items-center">
                    {keyword}
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="inline-block w-[2px] h-4 bg-gold ml-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {stages.map((stage, i) => (
                  <motion.div
                    key={stage.title}
                    initial={false}
                    animate={{
                      opacity: step > i ? 1 : step === i ? 1 : 0.4,
                      scale: step === i ? 1.02 : 1,
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-500",
                      step === i ? "bg-white/5 border-white/10 shadow-lg" : "border-transparent"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", stage.bg, stage.color)}>
                      <stage.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-foreground">{stage.title}</div>
                      <div className="text-[10px] text-muted-foreground">{step === i ? stage.desc : step > i ? "Complete" : "Pending"}</div>
                      {step === i && (
                        <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 4.5, ease: "linear" }}
                            className={cn("h-full", stage.bg.replace("10", "100"))}
                          />
                        </div>
                      )}
                    </div>
                    {step > i && <CheckCircle2 className="h-4 w-4 text-teal" />}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Content Preview */}
          <div className="flex-1 p-6 sm:p-8 bg-gradient-to-br from-white/[0.02] to-transparent relative overflow-hidden">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gold/5 border border-gold/10 flex items-center justify-center animate-pulse">
                    <Search className="h-8 w-8 text-gold/40" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[200px]">Waiting for your next big idea...</p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="brief"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-teal" />
                    <div className="h-3 w-2/3 bg-teal/20 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 w-full bg-white/5 rounded-full" />
                    <div className="h-2.5 w-5/6 bg-white/5 rounded-full" />
                    <div className="h-2.5 w-4/6 bg-white/5 rounded-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[9px] text-muted-foreground uppercase font-black mb-1">Volume</div>
                      <div className="text-base font-black text-foreground">12.5k</div>
                    </div>
                    <div className="p-3 bg-teal/10 rounded-xl border border-teal/20">
                      <div className="text-[9px] text-teal uppercase font-black mb-1">Difficulty</div>
                      <div className="text-base font-black text-teal">Easy</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-[9px] text-muted-foreground uppercase font-black mb-1">CPC</div>
                      <div className="text-base font-black text-foreground">$2.40</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gold/5 rounded-lg border border-gold/10">
                    <div className="text-[10px] text-gold font-bold mb-2">Top Entities</div>
                    <div className="flex flex-wrap gap-1.5">
                      {["sustainability", "vegan leather", "carbon neutral", "recycled materials"].map(tag => (
                        <span key={tag} className="text-[9px] px-2 py-1 bg-gold/10 text-gold rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {(step === 2 || step === 3 || step === 4) && (
                <motion.div
                  key="outline"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <Layout className="h-3.5 w-3.5 text-lilac" />
                      <h4 className="text-xs font-black text-foreground">Article Structure</h4>
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: "Introduction", words: 150 },
                        { title: "What Makes Sneakers Eco-Friendly?", words: 320 },
                        { title: "Top 10 Sustainable Brands", words: 580 }
                      ].map((section, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-1 bg-gradient-to-b from-teal/50 to-teal/10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                              <span className="text-[9px] text-muted-foreground">{section.words}w</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full" />
                            <div className="h-1.5 w-4/5 bg-white/5 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {step >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/10 to-gold/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-gold" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gold">AI Writing</span>
                        </div>
                        <span className="text-[10px] text-gold/60">2,847 words</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 w-full bg-gold/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "65%" }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-gold to-gold/60"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gold/80">Section 8 of 12</span>
                          <span className="text-gold/60">~45s remaining</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 4 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-teal/20 bg-teal/5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 text-teal" />
                        <span className="text-xs font-black text-teal">Draft Complete!</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <div className="text-lg font-black text-foreground">2,847</div>
                          <div className="text-[9px] text-muted-foreground">Words</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-teal">94</div>
                          <div className="text-[9px] text-muted-foreground">SEO Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-foreground">8m</div>
                          <div className="text-[9px] text-muted-foreground">Time</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
