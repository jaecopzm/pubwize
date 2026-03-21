"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ──────────────────────────────────────────────
   Design tokens (completely independent palette)
────────────────────────────────────────────── */
const t = {
  bg:      "#04040a",
  surface: "#090912",
  card:    "#0d0d1e",
  border:  "rgba(255,255,255,0.06)",
  borderH: "rgba(99,102,241,0.4)",
  accent:  "#6366f1",   // indigo electric
  accentG: "#818cf8",
  cyan:    "#22d3ee",
  rose:    "#f43f5e",
  green:   "#4ade80",
  amber:   "#fbbf24",
  text:    "#f8fafc",
  sub:     "#94a3b8",
  muted:   "#334155",
};

/* ──────────────────────────────────────────────
   Tiny reusable components
────────────────────────────────────────────── */
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 14px",
        borderRadius: 999,
        border: `1px solid ${t.borderH}`,
        background: "rgba(99,102,241,0.1)",
        color: t.accentG,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function GradText({
  children,
  from = t.accent,
  to = t.cyan,
}: {
  children: React.ReactNode;
  from?: string;
  to?: string;
}) {
  return (
    <span
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

/* Animated counter */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800;
        const steps = 60;
        const inc = end / steps;
        let cur = 0;
        const id = setInterval(() => {
          cur += inc;
          if (cur >= end) { setCount(end); clearInterval(id); }
          else setCount(Math.floor(cur));
        }, dur / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* Orb blob */
function Orb({ color, size, x, y, blur = 220 }: { color: string; size: number; x: string; y: string; blur?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: `blur(${blur}px)`,
        opacity: 0.35,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/* Grid overlay */
function GridOverlay() {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.04 }}
    >
      <defs>
        <pattern id="gridpat" width="52" height="52" patternUnits="userSpaceOnUse">
          <path d="M 52 0 L 0 0 0 52" fill="none" stroke="white" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gridpat)" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   SVG Icon set
────────────────────────────────────────────── */
function IconBolt({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconSearch({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IconShare({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
function IconServer({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
function IconBarChart({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function IconLayers({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
      <line x1="2" y1="15.5" x2="12" y2="22" /><line x1="22" y1="15.5" x2="12" y2="22" />
    </svg>
  );
}
function IconArrowRight({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function IconCheck({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconSparkle({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={t.accentG} stroke="none">
      <path d="M12 2l2.09 6.26L21 9.27l-5.18 4.73L17.18 21 12 17.54 6.82 21l1.36-7L2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function IconChevronUp({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
function IconMenu({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function IconX({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* Typing cycle for hero */
const heroWords = ["actually ranks.", "converts visitors.", "builds authority.", "drives revenue."];
function TypingCycle() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % heroWords.length), 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={heroWords[index]}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.45 }}
      >
        <GradText from={t.accent} to={t.cyan}>{heroWords[index]}</GradText>
      </motion.span>
    </AnimatePresence>
  );
}

/* FAQ Accordion item */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${open ? t.borderH : t.border}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "border-color 0.3s",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: t.text,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'Syne',sans-serif",
          letterSpacing: "-0.01em",
          textAlign: "left",
        }}
      >
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <IconChevronUp size={16} color={open ? t.accentG : t.sub} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 20px", fontSize: 15, lineHeight: 1.7, color: t.sub }}>
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Marquee logos */
const companyLogos = ["TechCrunch","Forbes","Wired","HubSpot","Moz","Ahrefs","Vercel","Stripe"];
function LogoMarquee() {
  return (
    <div style={{ overflow: "hidden", padding: "40px 0", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: t.surface }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.muted }}>
          Trusted by teams at
        </span>
      </div>
      <div className="marquee-track">
        {[...companyLogos, ...companyLogos].map((name, i) => (
          <div key={`${name}-${i}`} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 28px", marginRight: 32, flexShrink: 0,
            fontSize: 16, fontWeight: 800, color: t.muted,
            fontFamily: "'Syne',sans-serif", letterSpacing: "-0.01em",
            opacity: 0.5, userSelect: "none",
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${t.accent}30, ${t.cyan}30)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: t.accent }} />
            </div>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Comparison data */
const comparisonRows = [
  { feature: "Full SEO-optimized articles", pubwize: true, diy: false, agency: true },
  { feature: "Under 90 seconds per article", pubwize: true, diy: false, agency: false },
  { feature: "Built-in keyword research", pubwize: true, diy: false, agency: false },
  { feature: "One-click WordPress publish", pubwize: true, diy: false, agency: false },
  { feature: "Social media repurposing", pubwize: true, diy: false, agency: false },
  { feature: "Real-time SEO scoring", pubwize: true, diy: false, agency: true },
  { feature: "Cost per article", pubwize: "<$1", diy: "$0 + hours", agency: "$200+" },
  { feature: "Scale to 100+ articles/mo", pubwize: true, diy: false, agency: false },
];

const faqs = [
  { q: "How is Pubwize different from ChatGPT?", a: "ChatGPT generates raw text. Pubwize is purpose-built for SEO — it researches keywords, analyzes SERPs, structures outlines with proper heading hierarchy, optimizes for on-page SEO signals, and publishes directly to WordPress. It's an entire content workflow, not just a chatbot." },
  { q: "Will Google penalize AI-generated content?", a: "Google's guidelines are clear: they reward helpful, high-quality content regardless of how it's made. Pubwize articles are structured for E-E-A-T signals, include proper schema markup, and are optimized for user intent — not just keyword stuffing." },
  { q: "Can I try Pubwize for free?", a: "Absolutely. The free plan includes 5 articles per month with full access to keyword research, SEO scoring, and social repurposing. No credit card required." },
  { q: "Does it work with my WordPress site?", a: "Yes. Connect any WordPress site via our secure integration. Articles are pushed with images, meta descriptions, categories, tags, and proper formatting — zero copy-paste." },
  { q: "What AI models does Pubwize use?", a: "Pubwize uses a combination of frontier AI models optimized for different stages of the content pipeline — research, outlining, drafting, and optimization. We continuously upgrade to the latest models." },
  { q: "Can I maintain my brand voice?", a: "On the Pro plan and above, you can set custom brand voice guidelines, tone preferences, and writing style rules that the AI follows for every article." },
];

/* Logo */
function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <defs>
        <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.accent} />
          <stop offset="100%" stopColor={t.cyan} />
        </linearGradient>
      </defs>
      <rect width="34" height="34" rx="10" fill="url(#logoG)" />
      <path d="M10 11h10a4 4 0 0 1 0 8H10v-8z" fill="white" opacity="0.95" />
      <path d="M10 19h7" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M10 23h5" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   Feature cards data
────────────────────────────────────────────── */
const features = [
  {
    icon: IconBolt,
    color: t.accent,
    title: "AI Content Engine",
    size: "wide",
    desc: "Generate full SEO-optimized articles in under 90 seconds. From keyword to publish-ready draft — automated, structured, and human-quality.",
  },
  {
    icon: IconSearch,
    color: t.cyan,
    title: "Keyword Intelligence",
    size: "normal",
    desc: "Surface low-competition, high-intent keywords backed by real SERP data.",
  },
  {
    icon: IconShare,
    color: "#a78bfa",
    title: "Social Repurpose",
    size: "normal",
    desc: "One click turns your article into Twitter threads, LinkedIn posts, and newsletters.",
  },
  {
    icon: IconServer,
    color: t.green,
    title: "WordPress Publish",
    size: "normal",
    desc: "Push to WordPress with images, meta, and formatting — zero copy-paste.",
  },
  {
    icon: IconBarChart,
    color: t.amber,
    title: "SEO Scoring",
    size: "normal",
    desc: "Real-time on-page analysis with actionable fixes before you publish.",
  },
  {
    icon: IconLayers,
    color: t.rose,
    title: "Topical Clusters",
    size: "wide",
    desc: "Build entire content clusters and silos that drive domain authority at scale — programmatic SEO made simple.",
  },
];

/* Pricing plans */
const plans = [
  {
    name: "Starter",
    price: 0,
    desc: "Get started for free",
    features: ["5 articles / month", "Keyword research tool", "Social repurposing", "SEO scoring"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 29,
    desc: "For serious content teams",
    features: ["Unlimited articles", "Advanced AI models", "WordPress integration", "Bulk generation", "Priority support", "Custom brand voice"],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    name: "Agency",
    price: 79,
    desc: "Scale across clients",
    features: ["Everything in Pro", "Multi-site support", "White-label exports", "Team seats (5)", "API access", "Dedicated success manager"],
    cta: "Get Agency",
    highlighted: false,
  },
];

/* Testimonials */
const testimonials = [
  { name: "Sarah Chen", role: "Head of Content · Foundry", text: "We went from 4 articles a week to 40. The quality is indistinguishable from our human writers — and the SEO results are insane.", avatar: "SC" },
  { name: "Marcus Wright", role: "Founder · GrowthStack", text: "Pubwize is the first AI writing tool that actually understands SEO. Our organic traffic is up 280% in 90 days.", avatar: "MW" },
  { name: "Ana Pereira", role: "SEO Lead · Novara", text: "The topical cluster feature alone paid for the annual plan in the first month. This is the real deal.", avatar: "AP" },
];

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUp, setShowUp] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowUp(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
  ];

  return (
    <div style={{ background: t.bg, color: t.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      {/* ── Custom font import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Syne:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(99,102,241,0.35); color: #fff; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-slow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.9;transform:scale(1.06)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

        .float { animation: float 5s ease-in-out infinite; }
        .pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 28px; border-radius:12px; border:none; cursor:pointer;
          font-size:15px; font-weight:700; letter-spacing:-0.01em;
          background:linear-gradient(135deg,#6366f1,#818cf8,#22d3ee);
          background-size:200% 200%; animation:gradMove 4s ease infinite;
          color:#fff; transition:transform 0.2s,box-shadow 0.2s;
          box-shadow:0 0 32px rgba(99,102,241,0.35);
        }
        .btn-primary:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 0 48px rgba(99,102,241,0.5); }
        .btn-ghost {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 28px; border-radius:12px; cursor:pointer;
          font-size:15px; font-weight:600; letter-spacing:-0.01em;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          color:${t.sub}; transition:all 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.09); color:${t.text}; border-color:rgba(255,255,255,0.2); }
        .card {
          background:${t.card}; border:1px solid ${t.border};
          border-radius:20px; transition:border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .card:hover { border-color:${t.borderH}; transform:translateY(-3px); box-shadow:0 20px 60px rgba(99,102,241,0.12); }
        .nav-link {
          font-size:14px; font-weight:500; color:${t.sub}; text-decoration:none;
          transition:color 0.2s; letter-spacing:-0.01em;
        }
        .nav-link:hover { color:${t.text}; }
        .section { max-width:1160px; margin:0 auto; padding:0 24px; }
        .section-block { padding:120px 0; }
        .label {
          font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:500;
          letter-spacing:0.12em; text-transform:uppercase; color:${t.accentG};
        }
        .h1 {
          font-family:'Syne',sans-serif; font-size:clamp(52px,7vw,90px); font-weight:900;
          line-height:1.00; letter-spacing:-0.03em; color:${t.text};
        }
        .h2 {
          font-family:'Syne',sans-serif; font-size:clamp(36px,4.5vw,56px); font-weight:800;
          line-height:1.08; letter-spacing:-0.025em; color:${t.text};
        }
        .body-lg { font-size:18px; line-height:1.65; color:${t.sub}; font-weight:400; }
        .tag {
          display:inline-flex; align-items:center; gap:6px;
          padding:3px 10px; border-radius:6px; font-size:12px; font-weight:600;
          background:rgba(99,102,241,0.15); color:${t.accentG};
          border:1px solid rgba(99,102,241,0.25);
        }
        .shine-border {
          border:1px solid transparent;
          background:linear-gradient(${t.card},${t.card}) padding-box,
            linear-gradient(135deg,rgba(99,102,241,0.5),rgba(34,211,238,0.3),rgba(99,102,241,0.1)) border-box;
        }
        .desktop-only { display: inline-flex; }
        @keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .marquee-track {
          display:flex; width:max-content;
          animation:marquee-scroll 30s linear infinite;
        }
        .marquee-track:hover { animation-play-state:paused; }
        .grad-divider {
          height:1px; border:none;
          background:linear-gradient(90deg,transparent,rgba(99,102,241,0.3),rgba(34,211,238,0.2),transparent);
        }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════ */}
      <motion.header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          background: scrolled ? "rgba(4,4,10,0.8)" : "transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div className="section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          {/* Brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Logo size={34} />
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 900, color: t.text, letterSpacing: "-0.02em" }}>
              Pubwize
            </span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 32 }} className="desktop-nav">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="nav-link">{l.label}</a>
            ))}
            <a href="/blog" className="nav-link">Blog</a>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/auth/signin")} className="nav-link desktop-only" style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 4px" }}>
              Sign in
            </button>
            <button onClick={() => router.push("/auth/signup")} className="btn-primary" style={{ padding: "10px 20px", fontSize: 14, boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
              Get started free
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: t.sub, padding: 6 }}
              id="hamburger"
            >
              {mobileOpen ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: t.surface,
                borderBottom: `1px solid ${t.border}`,
                padding: "20px 24px",
                display: "flex", flexDirection: "column", gap: 16,
              }}
            >
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="nav-link" style={{ fontSize: 16, padding: "4px 0" }} onClick={() => setMobileOpen(false)}>
                  {l.label}
                </a>
              ))}
              <button onClick={() => router.push("/auth/signup")} className="btn-primary" style={{ marginTop: 8 }}>
                Get started free
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══ HERO ═════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position: "relative", paddingTop: 160, paddingBottom: 120, overflow: "hidden" }}>
        {/* Background orbs */}
        <Orb color={t.accent} size={700} x="-15%" y="-20%" blur={280} />
        <Orb color={t.cyan}   size={500} x="65%"  y="5%"  blur={240} />
        <Orb color="#a78bfa"  size={400} x="30%"  y="60%" blur={260} />
        <GridOverlay />

        <motion.div className="section" style={{ position: "relative", zIndex: 2, textAlign: "center", y: heroY }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge>
              <IconSparkle size={12} />
              Built for the AI era of content
            </Badge>
          </motion.div>

          <motion.h1
            className="h1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            style={{ marginTop: 28, marginBottom: 24 }}
          >
            SEO content that<br />
            <TypingCycle />
          </motion.h1>

          <motion.p
            className="body-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ maxWidth: 560, margin: "0 auto 40px" }}
          >
            Pubwize is your AI-first content platform. Generate ranked articles, repurpose to social, and publish to WordPress — all in one workflow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
          >
            <button onClick={() => router.push("/auth/signup")} className="btn-primary" style={{ fontSize: 16, padding: "16px 36px" }}>
              Start for free <IconArrowRight size={16} />
            </button>
            <a href="#features" className="btn-ghost" style={{ fontSize: 16, padding: "16px 36px", textDecoration: "none" }}>
              See how it works
            </a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{ marginTop: 56, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}
          >
            <div style={{ display: "flex" }}>
              {["SC","MW","AP","JL","KR"].map((initials,i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${[t.accent,t.cyan,"#a78bfa",t.rose,t.amber][i]}, ${[t.cyan,t.accent,t.accent,t.amber,t.rose][i]})`,
                  border: `2px solid ${t.bg}`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#fff",
                  marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i, position: "relative",
                }}>
                  {initials}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[...Array(5)].map((_,i) => <IconSparkle key={i} size={13} />)}
              </div>
              <span style={{ fontSize: 13, color: t.sub, fontWeight: 500 }}>
                Loved by <strong style={{ color: t.text }}>5,000+</strong> content teams
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero dashboard mockup */}
        <motion.div
          className="section"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          style={{ position: "relative", zIndex: 2, marginTop: 72 }}
        >
          <div style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 40px 120px rgba(99,102,241,0.18), 0 0 0 1px rgba(99,102,241,0.1)",
          }}>
            {/* Fake browser chrome */}
            <div style={{ background: t.surface, padding: "14px 20px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
              <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 26, marginLeft: 12, display: "flex", alignItems: "center", paddingLeft: 12 }}>
                <span style={{ fontSize: 12, color: t.muted, fontFamily: "'JetBrains Mono', monospace" }}>app.pubwize.com/dashboard</span>
              </div>
            </div>
            {/* Mock content */}
            <div style={{ padding: "28px 32px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, minHeight: 320 }}>
              {/* Sidebar mock */}
              <div style={{ borderRight: `1px solid ${t.border}`, paddingRight: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, color: t.muted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Workspace</div>
                {["Generate Article","Keyword Research","Social Repurpose","WordPress Publish"].map((item, i) => (
                  <div key={item} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8,
                    background: i === 0 ? "rgba(99,102,241,0.15)" : "transparent",
                    border: i === 0 ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                    cursor: "pointer",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: [t.accent,t.cyan,"#a78bfa",t.green][i] }} />
                    <span style={{ fontSize: 13, color: i === 0 ? t.accentG : t.sub, fontWeight: i === 0 ? 600 : 400 }}>{item}</span>
                  </div>
                ))}
              </div>
              {/* Main area mock */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: t.text, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>Generate Article</div>
                    <div style={{ fontSize: 13, color: t.sub }}>AI-powered SEO content in 90 seconds</div>
                  </div>
                  <div className="tag">Active</div>
                </div>
                {/* Input mock */}
                <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, color: t.sub, fontFamily: "'JetBrains Mono',monospace" }}>
                    <span style={{ color: t.accentG }}>keyword:</span> <span style={{ color: t.text }}>"best project management software 2025"</span>
                  </div>
                </div>
                {/* Progress bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "SEO Score", val: 94, color: t.green },
                    { label: "Readability", val: 88, color: t.accent },
                    { label: "Word Count", val: 72, color: t.cyan },
                  ].map((bar) => (
                    <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ minWidth: 88, fontSize: 12, color: t.sub, fontWeight: 500 }}>{bar.label}</div>
                      <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${bar.val}%` }}
                          transition={{ delay: 0.9, duration: 1.2, ease: "easeOut" }}
                          style={{ height: "100%", background: bar.color, borderRadius: 3 }}
                        />
                      </div>
                      <div style={{ minWidth: 32, fontSize: 12, fontWeight: 700, color: bar.color, textAlign: "right" }}>{bar.val}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ LOGO MARQUEE ══════════════════════════════════ */}
      <LogoMarquee />

      {/* ══ STATS STRIP ══════════════════════════════════ */}
      <section id="stats" style={{ padding: "56px 0", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
            {[
              { value: 5000, suffix: "+", label: "Teams worldwide" },
              { value: 10,   suffix: "x",  label: "Faster content" },
              { value: 94,   suffix: "%",  label: "Avg. SEO score" },
              { value: 280,  suffix: "%",  label: "Traffic growth" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: "16px 12px" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, color: t.text, letterSpacing: "-0.02em" }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 13, color: t.sub, marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════ */}
      <section id="features" style={{ padding: "120px 0" }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div className="label" style={{ marginBottom: 16 }}>Platform Features</div>
            <h2 className="h2">Everything your content<br />team needs to win</h2>
            <p className="body-lg" style={{ maxWidth: 520, margin: "16px auto 0" }}>
              From keyword discovery to ranking — a complete content stack built for modern SEO teams.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: "auto", gap: 20 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              const isWide = f.size === "wide";
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className="card"
                  style={{ gridColumn: isWide ? "span 2" : "span 1", padding: 32, position: "relative", overflow: "hidden" }}
                >
                  {/* Icon glow */}
                  <div style={{
                    position: "absolute", top: -30, right: -30,
                    width: 120, height: 120, borderRadius: "50%",
                    background: f.color, filter: "blur(50px)", opacity: 0.15, pointerEvents: "none",
                  }} />
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: `${f.color}15`,
                    border: `1px solid ${f.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    <Icon size={22} color={f.color} />
                  </div>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 10, letterSpacing: "-0.015em" }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: t.sub, lineHeight: 1.65 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════ */}
      <section style={{ padding: "120px 0", background: t.surface }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 72 }}
          >
            <div className="label" style={{ marginBottom: 16 }}>The Workflow</div>
            <h2 className="h2">From keyword to rankings<br />in four steps</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 2 }}>
            {[
              { step: "01", title: "Enter your keyword", desc: "Paste any target keyword or topic. Pubwize analyzes the SERP instantly.", color: t.accent },
              { step: "02", title: "Generate your article", desc: "Our AI produces a structured, keyword-rich article optimized for Google.", color: t.cyan },
              { step: "03", title: "Review & refine", desc: "In-line SEO scoring, readability checks, and one-click fixes.", color: "#a78bfa" },
              { step: "04", title: "Publish & repurpose", desc: "Push to WordPress and generate social posts — all in one click.", color: t.green },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: "36px 32px", position: "relative" }}
              >
                {/* Connector line */}
                {i < 3 && (
                  <div style={{
                    position: "absolute", top: 52, right: 0, width: 2, height: "60%",
                    background: `linear-gradient(${step.color},transparent)`, opacity: 0.2,
                  }} />
                )}
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
                  color: step.color, marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ display: "inline-flex", width: 28, height: 28, borderRadius: 8, background: `${step.color}15`, border: `1px solid ${step.color}30`, alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{step.step}</span>
                  Step {step.step}
                </div>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 10, letterSpacing: "-0.015em" }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: t.sub, lineHeight: 1.65 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════ */}
      <section id="testimonials" style={{ padding: "120px 0" }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div className="label" style={{ marginBottom: 16 }}>Social Proof</div>
            <h2 className="h2">Trusted by teams who<br />live and breathe SEO</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20 }}>
            {testimonials.map((t2, i) => (
              <motion.div
                key={t2.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
                style={{ padding: 32 }}
              >
                {/* Stars */}
                <div style={{ display: "flex", gap: 3, marginBottom: 20 }}>
                  {[...Array(5)].map((_,j) => <IconSparkle key={j} size={14} />)}
                </div>
                <p style={{ fontSize: 16, color: t.sub, lineHeight: 1.7, marginBottom: 24, fontStyle: "italic" }}>
                  "{t2.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${[t.accent,t.cyan,"#a78bfa"][i]}, ${[t.cyan,"#a78bfa",t.rose][i]})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
                  }}>
                    {t2.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{t2.name}</div>
                    <div style={{ fontSize: 12, color: t.sub }}>{t2.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <hr className="grad-divider" />

      {/* ══ WHY PUBWIZE (COMPARISON) ══════════════════════ */}
      <section id="comparison" style={{ padding: "120px 0" }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div className="label" style={{ marginBottom: 16 }}>Why Pubwize</div>
            <h2 className="h2">Stop overpaying for<br /><GradText from={t.accent} to={t.cyan}>mediocre content</GradText></h2>
            <p className="body-lg" style={{ maxWidth: 520, margin: "16px auto 0" }}>
              See how Pubwize stacks up against DIY AI prompting and traditional content agencies.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ overflowX: "auto" }}
          >
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 14, fontWeight: 600, color: t.sub, borderBottom: `1px solid ${t.border}` }}></th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontSize: 13, fontWeight: 800, color: t.text, borderBottom: `1px solid ${t.border}`, background: "rgba(99,102,241,0.08)", borderRadius: "12px 12px 0 0", fontFamily: "'Syne',sans-serif" }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <IconBolt size={14} color={t.accent} /> Pubwize
                    </span>
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontSize: 13, fontWeight: 600, color: t.sub, borderBottom: `1px solid ${t.border}` }}>DIY AI Prompts</th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontSize: 13, fontWeight: 600, color: t.sub, borderBottom: `1px solid ${t.border}` }}>Content Agency</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature}>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: t.sub, fontWeight: 500, borderBottom: i < comparisonRows.length - 1 ? `1px solid ${t.border}` : "none" }}>{row.feature}</td>
                    {(["pubwize", "diy", "agency"] as const).map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} style={{ padding: "14px 20px", textAlign: "center", borderBottom: i < comparisonRows.length - 1 ? `1px solid ${t.border}` : "none", background: col === "pubwize" ? "rgba(99,102,241,0.05)" : "transparent" }}>
                          {typeof val === "boolean" ? (
                            val ? <IconCheck size={16} color={t.green} /> : <IconX size={14} color={t.muted} />
                          ) : (
                            <span style={{ fontSize: 13, fontWeight: 700, color: col === "pubwize" ? t.green : t.sub }}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      <hr className="grad-divider" />

      {/* ══ PRICING ══════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "120px 0", background: t.surface }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 64 }}
          >
            <div className="label" style={{ marginBottom: 16 }}>Pricing</div>
            <h2 className="h2">Simple, transparent pricing</h2>
            <p className="body-lg" style={{ maxWidth: 440, margin: "12px auto 0" }}>Start free. Scale when you're ready. No hidden fees, no contracts.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={plan.highlighted ? "shine-border" : "card"}
                style={{
                  padding: "36px 32px",
                  position: "relative",
                  transform: plan.highlighted ? "scale(1.04)" : undefined,
                  boxShadow: plan.highlighted ? `0 0 60px rgba(99,102,241,0.2)` : undefined,
                }}
              >
                {plan.highlighted && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    padding: "4px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                    background: `linear-gradient(135deg, ${t.accent}, ${t.cyan})`,
                    color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>
                    Most popular
                  </div>
                )}
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: t.text }}>{plan.name}</span>
                </div>
                <div style={{ fontSize: 13, color: t.sub, marginBottom: 24 }}>{plan.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 48, fontWeight: 900, color: t.text, letterSpacing: "-0.03em" }}>
                    ${plan.price}
                  </span>
                  <span style={{ fontSize: 14, color: t.sub }}>/mo</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: plan.highlighted ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${plan.highlighted ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <IconCheck size={11} color={plan.highlighted ? t.accentG : t.sub} />
                      </div>
                      <span style={{ fontSize: 14, color: t.sub }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push(plan.price === 0 ? "/auth/signup" : "/pricing")}
                  className={plan.highlighted ? "btn-primary" : "btn-ghost"}
                  style={{ width: "100%", justifyContent: "center", padding: "14px 20px" }}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════ */}
      <section style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
        <Orb color={t.accent} size={600} x="50%" y="50%" blur={300} />
        <Orb color={t.cyan} size={400} x="70%" y="20%" blur={250} />
        <div className="section" style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="label" style={{ marginBottom: 24 }}>Get started today</div>
            <h2 className="h2" style={{ maxWidth: 640, margin: "0 auto 20px" }}>
              Ready to scale your<br />
              <GradText from={t.accent} to={t.cyan}>content operation?</GradText>
            </h2>
            <p className="body-lg" style={{ maxWidth: 480, margin: "0 auto 48px" }}>
              Join 5,000+ teams already using Pubwize to outrank competitors and grow organic traffic.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.push("/auth/signup")} className="btn-primary" style={{ fontSize: 16, padding: "18px 44px" }}>
                Start for free — no card needed
              </button>
            </div>
            <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
              {["5 free articles included", "No credit card", "Cancel anytime"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: t.sub }}>
                  <IconCheck size={13} color={t.accentG} />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════ */}
      <section id="faq" style={{ padding: "120px 0", background: t.surface }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <div className="label" style={{ marginBottom: 16 }}>FAQ</div>
            <h2 className="h2">Got questions?</h2>
            <p className="body-lg" style={{ maxWidth: 480, margin: "12px auto 0" }}>Everything you need to know about Pubwize.</p>
          </motion.div>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${t.border}`, background: t.surface, padding: "56px 0 32px" }}>
        <div className="section">
          {/* Footer grid */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${t.border}` }} className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Logo size={30} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 900, color: t.text, letterSpacing: "-0.02em" }}>Pubwize</span>
              </div>
              <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.7, maxWidth: 280 }}>
                AI-powered SEO content platform. From keyword to published post in minutes. Build authority and grow traffic on autopilot.
              </p>
            </div>
            {/* Product */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.text, marginBottom: 16 }}>Product</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Features","#features"],["Pricing","#pricing"],["How It Works","#how-it-works"],["Blog","/blog"]].map(([label, href]) => (
                  <a key={label} href={href} className="nav-link" style={{ fontSize: 13 }}>{label}</a>
                ))}
              </div>
            </div>
            {/* Legal */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.text, marginBottom: 16 }}>Legal</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[["Terms","/terms"],["Privacy","/privacy"],["Refunds","/refunds"]].map(([label, href]) => (
                  <a key={label} href={href} className="nav-link" style={{ fontSize: 13 }}>{label}</a>
                ))}
              </div>
            </div>
            {/* Support */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.text, marginBottom: 16 }}>Support</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="/contact" className="nav-link" style={{ fontSize: 13 }}>Contact Us</a>
                <a href="mailto:support@pubwize.com" className="nav-link" style={{ fontSize: 13 }}>Email Support</a>
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 13, color: t.muted }}>© 2026 Pubwize, Inc. All rights reserved.</span>
            <span style={{ fontSize: 13, color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>v2.0 · AI-Powered</span>
          </div>
        </div>
      </footer>

      {/* ══ BACK TO TOP ══════════════════════════════════ */}
      <AnimatePresence>
        {showUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              position: "fixed", bottom: 28, right: 28, zIndex: 999,
              width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${t.accent}, ${t.cyan})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
              color: "#fff",
            }}
          >
            <IconChevronUp />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width:900px) {
          .desktop-nav { display:none !important; }
          .desktop-only { display:none !important; }
          #hamburger { display:flex !important; }
          [style*="gridTemplateColumns: repeat(3"] { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width:600px) {
          [style*="gridTemplateColumns: repeat(3"] { grid-template-columns: 1fr !important; }
          [style*="gridTemplateColumns: repeat(auto-fit"] { grid-template-columns: 1fr !important; }
          [style*="gridTemplateColumns: 220px"] { grid-template-columns: 1fr !important; }
          [style*="gridColumn: span 2"] { grid-column: span 1 !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .section-block { padding: 80px 0 !important; }
          .h1 { font-size: clamp(36px, 9vw, 52px) !important; }
          .h2 { font-size: clamp(28px, 7vw, 40px) !important; }
        }
      `}</style>
    </div>
  );
}
