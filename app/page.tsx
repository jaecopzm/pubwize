"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Sparkles, Zap, TrendingUp, CheckCircle2,
  Globe, FileText, Calendar, ChevronRight,
  BarChart2, MousePointer2, Clock, Menu, X
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PricingCards } from "@/components/pricing";
import { cn } from "@/lib/utils";
import { StructuredData } from "@/components/seo/structured-data";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateSoftwareApplicationSchema,
} from "@/lib/seo/structured-data";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroDemo } from "@/components/landing/hero-demo";
import { BeforeAfter } from "@/components/landing/before-after";
import { Sparkles as SparklesIcon } from "lucide-react";

/* ─── Animated counter hook ─────────────────────────────────────── */
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ─── Intersection observer hook ────────────────────────────────── */
function useInView(threshold = 0.2): [React.RefObject<any>, boolean] {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

/* ─── Stat card ─────────────────────────────────────────────────── */
function StatCard({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) {
  const count = useCounter(value, 1800, started);
  return (
    <div className="text-center space-y-1 group hover:-translate-y-1 transition-transform duration-300">
      <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--gold)] font-display leading-none drop-shadow-sm group-hover:scale-105 transition-transform">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[10px] sm:text-xs text-[var(--text-3)] font-medium tracking-wide uppercase">{label}</div>
    </div>
  );
}

/* ─── Step card ─────────────────────────────────────────────────── */
function StepCard({ number, title, desc, icon: Icon }: { number: number; title: string; desc: string; icon: any }) {
  return (
    <div className="flex flex-col md:flex-row gap-2 sm:gap-3 items-start group">
      <div className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center text-sm sm:text-base font-black text-[var(--gold)] font-display shadow-inner group-hover:bg-[var(--gold)]/20 transition-colors duration-300">
        {number}
      </div>
      <div className="space-y-1 mt-0.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-[var(--teal)] group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-1)]">{title}</h3>
        </div>
        <p className="text-[10px] sm:text-xs text-[var(--text-2)] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export default function LandingPage() {
  const [statsRef, statsInView] = useInView(0.3);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const features = [
    { icon: FileText, title: "AI Article Generation", desc: "Full-length, SEO-ready articles from a single keyword. Brief, outline, and draft — done in under 2 minutes." },
    { icon: TrendingUp, title: "Real-Time SEO Scoring", desc: "Built-in content grader surfaces quick wins. See exactly which tweaks improve your content's SEO potential." },
    { icon: Calendar, title: "Content Calendar", desc: "Plan, schedule, and manage your entire pipeline without leaving the platform." },
    { icon: Globe, title: "1-Click WordPress Publish", desc: "Push finished articles to any WordPress site with images and metadata — no copy-paste, ever." },
    { icon: Zap, title: "Keyword Intelligence", desc: "Spot low-competition keywords with live search volume, CPC, and difficulty data." },
    { icon: BarChart2, title: "Performance Analytics", desc: "Track rankings, traffic, and article ROI in one unified dashboard." },
  ];

  const steps = [
    { icon: MousePointer2, title: "Enter a keyword", desc: "Type any keyword or paste a URL. Pubwize pulls live search data and competitor insights instantly." },
    { icon: Sparkles, title: "AI drafts your article", desc: "Our model generates an SEO brief, structured outline, and full-length draft — all in seconds." },
    { icon: TrendingUp, title: "Review & refine", desc: "Score your article, swap images, tweak headings. Everything in a clean, distraction-free editor." },
    { icon: Globe, title: "Publish & track", desc: "Push live to WordPress with one click. Watch rankings move directly in your dashboard." },
  ];

  // Removed fake testimonials - they're a red flag for users

  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);

  return (
    <>
        {/* Structured Data for SEO */}
        <StructuredData data={generateOrganizationSchema()} />
        <StructuredData data={generateWebSiteSchema()} />
        <StructuredData data={generateSoftwareApplicationSchema()} />

        <div className="min-h-screen bg-background aurora-bg noise-overlay overflow-x-hidden selection:bg-[var(--gold)]/20 selection:text-[var(--gold)] relative">

          {/* ══ Background Ambient Effects ════════════════════════════════ */}
          <motion.div style={{ y: y1 }} className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-[var(--gold)]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <motion.div style={{ y: y2 }} className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-[var(--teal)]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none -z-10" />

          {/* ══ Navigation ══════════════════════════════════════════════ */}
          <nav className="border-b border-border/40 bg-background/70 sticky top-0 z-50 backdrop-blur-2xl shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02]">
                <img src="/PubWize.png" alt="Pubwize" className="h-10 sm:h-12" />
              </Link>

              {/* Desktop nav */}
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="hidden lg:flex items-center gap-6 mr-4">
                  <Link href="#how-it-works" className="text-xs font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">How It Works</Link>
                  <Link href="#features" className="text-xs font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Features</Link>
                  <Link href="#pricing" className="text-xs font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Pricing</Link>
                  <Link href="/blog" className="text-xs font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Blog</Link>
                  <Link href="/auth/signin" className="text-xs font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Sign In</Link>
                </div>
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Link href="/auth/signup" className="btn-gold hidden lg:inline-flex text-xs px-4 py-2 shadow-lg shadow-[var(--gold)]/20 hover:shadow-[var(--gold)]/40 transition-shadow">Get Started Free</Link>

                {/* Mobile menu button */}
                <div className="flex items-center gap-2 lg:hidden">
                  <ThemeToggle />
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle Menu"
                    className="p-1.5 rounded-lg border border-border/50 bg-secondary/50 text-[var(--text-1)] hover:bg-secondary transition-colors touch-manipulation"
                  >
                    {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile menu */}
            <div className={cn(
              "lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-background/95 backdrop-blur-xl border-b border-border/40 absolute w-full z-40",
              menuOpen ? "max-h-96 opacity-100 py-4" : "max-h-0 opacity-0 py-0"
            )}>
              <div className="flex flex-col gap-4 px-4">
                <Link href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">How It Works</Link>
                <Link href="#features" onClick={() => setMenuOpen(false)} className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Features</Link>
                <Link href="#pricing" onClick={() => setMenuOpen(false)} className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Pricing</Link>
                <Link href="/blog" onClick={() => setMenuOpen(false)} className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Blog</Link>
                <Link href="/auth/signin" onClick={() => setMenuOpen(false)} className="text-sm font-bold text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">Sign In</Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="btn-gold text-xs text-center py-2.5 shadow-lg">Get Started Free</Link>
              </div>
            </div>
          </nav>

          {/* ══ Hero ════════════════════════════════════════════════════ */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16 text-center relative z-10">

            {/* Live badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-2.5 sm:px-3 py-1 mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--teal)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--teal)] shadow-[0_0_6px_var(--teal)]"></span>
              </span>
              <span className="text-[0.55rem] sm:text-[0.6rem] font-bold text-[var(--gold)] tracking-[0.2em] font-mono uppercase">AI-POWERED SEO — LIVE IN SECONDS</span>
            </div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display text-[var(--text-1)] leading-[1.05] tracking-tight mb-3 sm:mb-4 max-w-4xl mx-auto px-4"
            >
              Rank-Ready Articles,<br />
              <span className="gradient-gold-teal pb-2 inline-block">Published in Minutes</span>
            </motion.h1>

            {/* Subhead */}
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-2)] max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-4">
              Pubwize takes you from keyword to WordPress post — keyword research, AI draft, SEO scoring, and one-click publish, all in one workflow.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <button 
                onClick={() => {
                  console.log('Signup button clicked');
                  router.push('/auth/signup');
                }}
                className="btn-gold group w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-xs md:text-sm flex items-center justify-center gap-2 relative overflow-hidden shadow-xl shadow-[var(--gold)]/20 touch-manipulation"
              >
                <span className="relative z-10 font-extrabold">Start Free (5 Articles)</span>
                <ArrowRight className="w-3.5 h-3.5 relative z-10 transition-transform group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </button>
              <Link href="#how-it-works" className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-xs md:text-sm font-bold text-[var(--text-1)] rounded-xl border border-border/60 hover:border-[var(--gold)]/30 hover:bg-secondary/30 transition-all flex items-center justify-center gap-2 group backdrop-blur-sm touch-manipulation">
                See How It Works <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1 text-[var(--text-3)]" />
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 mb-10 sm:mb-14">
              {["Free forever plan", "No credit card required", "Upgrade anytime"].map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[var(--teal)]" />
                  <span className="text-[10px] sm:text-xs font-bold text-[var(--text-3)]">{item}</span>
                </div>
              ))}
            </div>

            {/* INTEGRATED HERO DEMO */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <HeroDemo />
            </motion.div>
          </section>

          {/* ══ Before & After Section ═══════════════════════════════════ */}
          <BeforeAfter />

          {/* ══ Stats bar ═══════════════════════════════════════════════ */}
          <section ref={statsRef} className="border-y border-border/40 bg-secondary/10 backdrop-blur-md relative z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <StatCard value={2} suffix=" min" label="Average Draft Time" started={statsInView} />
              <StatCard value={4} suffix=" steps" label="Keyword to Published" started={statsInView} />
              <StatCard value={1} suffix=" platform" label="Everything You Need" started={statsInView} />
            </div>
          </section>

          {/* ══ How It Works ════════════════════════════════════════════ */}
          <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16 relative">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 mb-3 sm:mb-4 bg-background/50 backdrop-blur-sm">
                <Clock className="w-3 h-3 text-[var(--teal)]" />
                <span className="text-[0.55rem] sm:text-[0.6rem] font-bold text-[var(--text-3)] tracking-[0.15em] uppercase">4-Step Workflow</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-display text-[var(--text-1)] tracking-tight mb-3 sm:mb-4">From Idea to <span className="gradient-gold-teal">Published</span> in One Tab</h2>
              <p className="text-xs sm:text-sm md:text-base text-[var(--text-2)] max-w-xl mx-auto leading-relaxed">No juggling tools. No copy-paste marathons. One platform, one workflow, done.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6 max-w-7xl mx-auto relative">
              {/* Progress line for desktop */}
              <div className="hidden lg:block absolute top-6 left-[10%] right-[10%] h-px bg-gradient-to-r from-[var(--gold)]/40 via-[var(--teal)]/40 to-transparent -z-10" />

              {steps.map((step, i) => (
                <div key={i} className={cn("animate-in fade-in slide-in-from-bottom-8 duration-700 bg-background/50 p-3 sm:p-4 rounded-xl border border-transparent hover:border-border/60 transition-colors", `delay-${i * 100}`)}>
                  <StepCard number={i + 1} {...step} />
                </div>
              ))}
            </div>
          </section>

          {/* ══ Features ════════════════════════════════════════════════ */}
          <section id="features" className="bg-secondary/5 border-y border-border/40 py-10 sm:py-14 md:py-16 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--gold)]/5 blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-display text-[var(--text-1)] tracking-tight mb-3 sm:mb-4">Built for Serious <span className="gradient-gold-teal">Content Teams</span></h2>
                <p className="text-xs sm:text-sm md:text-base text-[var(--text-2)] max-w-xl mx-auto leading-relaxed">Every feature crafted to save time and move rankings — nothing bloated, nothing missing.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {features.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="card-premium group hover:-translate-y-2 transition-all duration-300 p-4 sm:p-5 border border-border/50 hover:border-[var(--gold)]/30 hover:shadow-2xl hover:shadow-[var(--gold)]/5 bg-background/80 backdrop-blur-sm"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:bg-[var(--gold)]/20 transition-all duration-300">
                      <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-1)] mb-1.5 sm:mb-2 group-hover:text-[var(--gold)] transition-colors">{f.title}</h3>
                    <p className="text-[10px] sm:text-xs text-[var(--text-2)] leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ Dashboard Preview ══════════════════════════════════════ */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16 relative">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-1.5 mb-4 sm:mb-6">
                <Sparkles className="w-3 h-3 text-[var(--gold)]" />
                <span className="text-[0.6rem] font-bold text-[var(--gold)] tracking-[0.2em] font-mono uppercase">POWERFUL DASHBOARD</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-display text-[var(--text-1)] tracking-tight mb-3 sm:mb-4">
                Everything in <span className="gradient-gold-teal">One Place</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-[var(--text-2)] max-w-2xl mx-auto leading-relaxed">
                Manage articles, sites, and content calendar from a clean, intuitive dashboard designed for productivity.
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/10 bg-card">
              <img 
                src="/pubwize-dashboard.png" 
                alt="Pubwize Dashboard Interface" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
            </div>
          </section>

          {/* ══ Social Proof ════════════════════════════════════════════ */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 mb-6 bg-background/50 backdrop-blur-sm">
                <CheckCircle2 className="w-3 h-3 text-[var(--teal)]" />
                <span className="text-[0.6rem] font-bold text-[var(--text-3)] tracking-[0.15em] uppercase">Why Pubwize</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-[var(--text-1)] tracking-tight mb-6 sm:mb-8">
                Built for <span className="gradient-gold-teal">Modern Content</span>
              </h2>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[var(--teal)]" />
                  <span className="text-[10px] sm:text-xs font-bold text-[var(--text-3)]">No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[var(--teal)]" />
                  <span className="text-[10px] sm:text-xs font-bold text-[var(--text-3)]">Start Free Forever</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[var(--teal)]" />
                  <span className="text-[10px] sm:text-xs font-bold text-[var(--text-3)]">Cancel Anytime</span>
                </div>
              </div>
            </div>
          </section>

          {/* ══ Blog Section ═══════════════════════════════════════════ */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16 relative">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--teal)]/30 bg-[var(--teal)]/10 px-3 py-1 mb-4 sm:mb-6">
                <Sparkles className="w-3 h-3 text-[var(--teal)]" />
                <span className="text-[0.6rem] font-bold text-[var(--teal)] tracking-[0.2em] font-mono uppercase">SEO INSIGHTS</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-[var(--text-1)] mb-3 sm:mb-4">
                Learn from the <span className="text-[var(--gold)]">experts</span>
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-2)] max-w-2xl mx-auto leading-relaxed">
                Proven SEO strategies, AI content tips, and ranking tactics from the team building the future of content marketing.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {[
                {
                  title: "Why AI-Generated Content Ranks (When Done Right)",
                  excerpt: "Google doesn't penalize AI content — it penalizes thin, unhelpful content. Here's how to use AI to produce articles that actually rank.",
                  readTime: "4 min read",
                  tag: "AI Writing",
                  slug: "ai-content-that-ranks"
                },
                {
                  title: "The Pillar-Cluster Strategy That Doubled Our Traffic",
                  excerpt: "How we used topic clusters and internal linking to dominate competitive keywords and build topical authority.",
                  readTime: "6 min read",
                  tag: "SEO Strategy",
                  slug: "pillar-cluster-strategy"
                },
                {
                  title: "How to Rank a New Article in 30 Days",
                  excerpt: "The exact process we use to get fresh content ranking on page one within a month, even in competitive niches.",
                  readTime: "5 min read",
                  tag: "Quick Wins",
                  slug: "rank-new-article-30-days"
                }
              ].map((post, i) => (
                <Link key={i} href={`/blog/${post.slug}`} className="group cursor-pointer">
                  <article className="rounded-2xl border border-border/50 bg-background/50 p-6 sm:p-8 transition-all duration-300 hover:border-[var(--gold)]/30 hover:shadow-xl hover:shadow-[var(--gold)]/5 hover:-translate-y-1 backdrop-blur-sm h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[0.6rem] font-bold text-[var(--gold)] bg-[var(--gold)]/10 px-2 py-0.5 rounded-md tracking-[0.15em] uppercase">
                        {post.tag}
                      </span>
                      <span className="text-[0.6rem] text-[var(--text-3)] font-medium">{post.readTime}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-1)] mb-3 group-hover:text-[var(--gold)] transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 text-[var(--gold)] group-hover:gap-3 transition-all">
                      <span className="text-xs font-bold">Read article</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link 
                href="/blog" 
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--teal)]/30 bg-[var(--teal)]/10 px-6 py-3 text-sm font-bold text-[var(--teal)] hover:bg-[var(--teal)]/20 hover:border-[var(--teal)]/50 transition-all shadow-lg shadow-[var(--teal)]/10 hover:shadow-[var(--teal)]/20"
              >
                <Sparkles className="w-4 h-4" />
                View all articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* ══ Pricing ═════════════════════════════════════════════════ */}
          <section id="pricing" className="bg-secondary/5 border-y border-border/40 py-12 sm:py-16 md:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="max-w-6xl mx-auto">
                <PricingCards
                  currentPlan="free"
                  onSelectPlan={(plan, isAnnual) => {
                    console.log('Landing page onSelectPlan:', plan, isAnnual);
                    if (plan === 'free') {
                      window.location.href = '/auth/signup';
                    } else {
                      window.location.href = `/auth/signup?plan=${plan}&billing=${isAnnual ? 'annual' : 'monthly'}`;
                    }
                  }}
                />
              </div>
            </div>
          </section>

          {/* ══ Closing CTA ═════════════════════════════════════════════ */}
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="group relative max-w-4xl mx-auto p-6 sm:p-10 md:p-14 rounded-[2rem] border border-gold/30 bg-surface-1/40 backdrop-blur-3xl shadow-[0_30px_80px_rgba(245,166,35,0.1)] overflow-hidden"
            >
              {/* Decorative "Sparkle" SVGs */}
              <div className="absolute top-6 left-6 text-gold/20 animate-bounce">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div className="absolute bottom-6 right-6 text-teal/20 animate-pulse">
                <SparklesIcon className="h-8 w-8" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 mb-6 group-hover:rotate-12 transition-transform duration-500">
                  <Zap className="h-6 w-6 text-gold fill-gold" />
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display text-[var(--text-1)] tracking-tight mb-4">
                  Ready to Put Your SEO<br />
                  <span className="gradient-gold-teal pb-2 inline-block italic underline decoration-gold/30">On Autopilot?</span>
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-[var(--text-2)] mb-6 leading-relaxed max-w-xl mx-auto">
                  Stop wrestling with AI prompts and manual formatting. Start creating rank-ready content with AI-powered SEO tools.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/auth/signup" className="btn-gold group px-6 py-3 text-sm flex items-center justify-center gap-2 w-full sm:w-auto relative overflow-hidden shadow-2xl shadow-gold/30 active:scale-95 transition-all">
                    <span className="relative z-10 font-black">Get Started Free — It's Instant</span>
                    <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-2" />
                  </Link>
                  <Link href="#pricing" className="px-6 py-3 text-sm font-bold text-foreground hover:bg-white/5 border border-white/5 rounded-xl transition-all w-full sm:w-auto">
                    View Enterprise Plans
                  </Link>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ══ Footer ══════════════════════════════════════════════════ */}
          <footer className="border-t border-border/40 bg-background/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 lg:gap-12 mb-10 sm:mb-12">
                <div className="lg:col-span-2">
                  <Link href="/" className="flex items-center gap-2.5 mb-4 sm:mb-5">
                    <img src="/PubWize.png" alt="Pubwize" className="h-10 sm:h-12" />
                  </Link>
                  <p className="text-xs sm:text-sm text-[var(--text-3)] leading-relaxed max-w-sm">
                    AI-powered SEO content platform. From keyword to published post in minutes. Build authority and grow traffic on autopilot.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-1)] tracking-[0.15em] uppercase mb-3 sm:mb-4">Product</h4>
                  <ul className="space-y-2 sm:space-y-3">
                    {[["Features", "#features"], ["Pricing", "#pricing"], ["Blog", "/blog"], ["Dashboard", "/dashboard"]].map(([label, href]) => (
                      <li key={label}><Link href={href} className="text-xs sm:text-sm text-[var(--text-3)] font-medium hover:text-[var(--gold)] transition-colors">{label}</Link></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-1)] tracking-[0.15em] uppercase mb-3 sm:mb-4">Legal</h4>
                  <ul className="space-y-2 sm:space-y-3">
                    {[["Terms", "/terms"], ["Privacy", "/privacy"], ["Refunds", "/refunds"]].map(([label, href]) => (
                      <li key={label}><Link href={href} className="text-xs sm:text-sm text-[var(--text-3)] font-medium hover:text-[var(--gold)] transition-colors">{label}</Link></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-1)] tracking-[0.15em] uppercase mb-3 sm:mb-4">Support</h4>
                  <ul className="space-y-2 sm:space-y-3">
                    <li><Link href="/contact" className="text-xs sm:text-sm text-[var(--text-3)] font-medium hover:text-[var(--gold)] transition-colors">Contact Us</Link></li>
                    <li><a href="mailto:support@pubwize.com" className="text-xs sm:text-sm text-[var(--text-3)] font-medium hover:text-[var(--gold)] transition-colors">Email Support</a></li>
                    <li><p className="text-xs sm:text-sm text-[var(--text-3)] font-medium">support@pubwize.com</p></li>
                  </ul>
                </div>
              </div>
              <div className="pt-6 sm:pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
                <p className="text-xs font-medium text-[var(--text-3)] text-center sm:text-left">© {new Date().getFullYear()} Pubwize. All rights reserved.</p>
                <p className="text-xs font-medium text-[var(--text-3)] flex items-center gap-1.5">
                  Made for teams who take SEO seriously <Zap className="w-3.5 h-3.5 text-[var(--gold)]" />
                </p>
              </div>
            </div>
          </footer>
        </div>
    </>
  );
}