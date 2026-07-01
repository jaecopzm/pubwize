"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { PricingCards } from "@/components/pricing";

/* ──────────────────────────────────────────────
   Design tokens (completely independent palette)
────────────────────────────────────────────── */
const t = {
  bg:      "var(--obsidian)",
  surface: "var(--surface-1)",
  card:    "var(--surface-2)",
  border:  "var(--premium-border)",
  borderH: "var(--premium-glow)",
  accent:  "var(--gold)",
  accentG: "var(--gold-dim)",
  cyan:    "var(--teal)",
  rose:    "var(--lilac)",
  green:   "var(--chart-3)",
  amber:   "var(--chart-4)",
  text:    "var(--text-1)",
  sub:     "var(--text-2)",
  muted:   "var(--text-3)",
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

/* Animated counter - removed as not needed */

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
          <path d="M 52 0 L 0 0 0 52" fill="none" stroke="var(--text-1)" strokeWidth="0.8" />
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
function IconSun({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconMoon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* Trust badge icons */
function IconShield({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconGlobe({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function IconCreditCard({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
      <line x1="5" y1="16" x2="7" y2="16" strokeWidth="3" />
    </svg>
  );
}
function IconRefresh({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
function IconZap({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/* Typing cycle for hero */
const heroWords = ["actually ranks.", "drives revenue.", "builds authority.", "converts visitors."];
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.01 }}
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
    </motion.div>
  );
}

/* Integration logos with real SVGs */
function WordPressIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#21759b">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM3.6 12c0-1.077.192-2.11.54-3.07l2.98 8.16A8.412 8.412 0 013.6 12zm8.4 8.4a8.41 8.41 0 01-2.4-.35l2.549-7.404 2.611 7.154a.37.37 0 00.028.055A8.41 8.41 0 0112 20.4zm1.166-12.434c.51-.027.969-.081.969-.081.457-.054.404-.726-.054-.699 0 0-1.37.108-2.255.108-.83 0-2.226-.108-2.226-.108-.458-.027-.511.672-.054.699 0 0 .432.054.889.081l1.32 3.616-1.854 5.562-3.085-9.178c.51-.027.966-.081.966-.081.457-.054.404-.726-.054-.699 0 0-1.37.108-2.255.108-.159 0-.345-.004-.542-.01A8.408 8.408 0 0112 3.6c2.194 0 4.193.838 5.692 2.209-.036-.002-.071-.007-.108-.007-1.084 0-1.851.944-1.851 1.956 0 .91.524 1.678 1.082 2.587.42.726.91 1.652.91 2.993 0 .928-.357 2.007-.82 3.508l-1.074 3.589-3.665-10.869zm3.494 11.842l2.598-7.508c.484-1.211.646-2.179.646-3.044 0-.313-.02-.604-.057-.877A8.402 8.402 0 0120.4 12a8.41 8.41 0 01-3.74 7.008v.8z"/>
    </svg>
  );
}
function GoogleIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
function OpenAIIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
      <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 004.981 4.18a5.985 5.985 0 00-3.998 2.9 6.046 6.046 0 00.743 7.097 5.98 5.98 0 00.51 4.911 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.26 24a6.056 6.056 0 005.772-4.206 5.99 5.99 0 003.997-2.9 6.056 6.056 0 00-.747-7.073zM13.26 22.43a4.476 4.476 0 01-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 00.392-.681v-6.737l2.02 1.168a.071.071 0 01.038.052v5.583a4.504 4.504 0 01-4.494 4.494zM3.6 18.304a4.47 4.47 0 01-.535-3.014l.142.085 4.783 2.759a.771.771 0 00.771 0l5.843-3.369v2.332a.08.08 0 01-.033.062L9.74 19.95a4.5 4.5 0 01-6.14-1.646zM2.34 7.896a4.485 4.485 0 012.366-1.973V11.6a.773.773 0 00.388.677l5.815 3.355-2.02 1.168a.076.076 0 01-.071 0L4.072 14.11A4.501 4.501 0 012.34 7.896zm16.597 3.855l-5.833-3.387 2.02-1.168a.076.076 0 01.071 0l4.746 2.74a4.494 4.494 0 01-.696 8.1v-5.678a.797.797 0 00-.308-.607zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 00-.772 0L9.426 9.23V6.897a.066.066 0 01.028-.061l4.826-2.782a4.5 4.5 0 016.635 4.66zm-12.66 4.135l-2.02-1.164a.08.08 0 01-.038-.057V6.075a4.5 4.5 0 017.375-3.453l-.142.08L8.704 5.46a.795.795 0 00-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
}
function VercelIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
      <path d="M24 22.525H0l12-21.05 12 21.05z"/>
    </svg>
  );
}
function StripeIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#6772e5">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
    </svg>
  );
}

function GroqIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#10a37f"/>
      <text x="14" y="19" textAnchor="middle" fill="white" fontSize="15" fontWeight="700" fontFamily="system-ui">G</text>
    </svg>
  );
}
function SerperIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#3b82f6"/>
      <circle cx="13" cy="13" r="5" stroke="white" strokeWidth="2" fill="none"/>
      <line x1="16.5" y1="16.5" x2="20" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function UnsplashIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#6b7280"/>
      <rect x="8" y="15" width="12" height="5" rx="1" fill="white"/>
      <rect x="10" y="8" width="8" height="7" rx="1" fill="white"/>
    </svg>
  );
}
function UpstashIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#eab308"/>
      <path d="M10 8l4 6-4 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M15 8l4 6-4 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
    </svg>
  );
}
function ResendIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#111"/>
      <rect x="6" y="10" width="16" height="8" rx="2" fill="white"/>
      <path d="M6 11l8 5 8-5" stroke="#111" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}
function ClerkIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#6366f1"/>
      <circle cx="14" cy="11" r="4" fill="white"/>
      <ellipse cx="14" cy="20" rx="6" ry="3" fill="white" opacity="0.6"/>
    </svg>
  );
}

const integrationLogos = [
  { name: "WordPress", icon: WordPressIcon, color: "#21759b" },
  { name: "Google Gemini", icon: GoogleIcon, color: "#4285F4" },
  { name: "Groq", icon: GroqIcon, color: "#10a37f" },
  { name: "Serper", icon: SerperIcon, color: "#3b82f6" },
  { name: "OpenAI", icon: OpenAIIcon, color: "#000" },
  { name: "Unsplash", icon: UnsplashIcon, color: "#6b7280" },
  { name: "Upstash", icon: UpstashIcon, color: "#eab308" },
  { name: "Resend", icon: ResendIcon, color: "#111" },
  { name: "Clerk", icon: ClerkIcon, color: "#6366f1" },
];

function LogoMarquee() {
  return (
    <div style={{ overflow: "hidden", padding: "32px 0", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: t.surface }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: t.muted, fontFamily: "'JetBrains Mono',monospace" }}>
          Seamless WordPress Integration
        </span>
      </div>
      <div className="marquee-track">
        {[...integrationLogos, ...integrationLogos].map((logo, i) => {
          const Icon = logo.icon;
          return (
            <div key={`${logo.name}-${i}`} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "8px 28px", marginRight: 24, flexShrink: 0,
              fontSize: 14, fontWeight: 700, color: t.sub,
              fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em",
              opacity: 0.6, userSelect: "none",
            }}>
              <Icon size={28} />
              {logo.name}
            </div>
          );
        })}
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
  { q: "What if I change my mind? Can I cancel?", a: "Absolutely. You can cancel anytime from your dashboard — no forms, no calls, no questions asked. Your subscription stops immediately and you keep access until the end of your billing period. If you're on a paid plan and not satisfied, email us within 14 days for a full refund." },
];

/* Logo */
function Logo({ size = 34 }: { size?: number }) {
  return <img src="/pubwize-icon.png" alt="Pubwize" width={size} height={size} style={{ display: "block" }} />;
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
/* Minimal, credible social proof */
const testimonials = [];

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUp, setShowUp] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [demoKeyword, setDemoKeyword] = useState("");
  const [demoGenerating, setDemoGenerating] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowUp(window.scrollY > 600);
      
      // Calculate scroll progress
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
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
    <div style={{ background: t.bg, color: t.text, fontFamily: "var(--font-jakarta), 'Inter', sans-serif", minHeight: "100vh", overflowX: "hidden", position: "relative" }}>
      {/* Noise texture overlay */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        opacity: 0.022,
      }} />
      
      {/* Scroll progress bar */}
      <motion.div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${t.accent}, ${t.cyan})`,
          transformOrigin: "0%",
          scaleX: scrollProgress / 100,
          zIndex: 9999,
        }}
      />
      {/* ── Custom font import ── */}
      <style>{`
        :root {
          --btn-ghost-bg: rgba(0,0,0,0.04);
          --btn-ghost-border: rgba(0,0,0,0.08);
          --btn-ghost-bg-hover: rgba(0,0,0,0.08);
          --btn-ghost-border-hover: rgba(0,0,0,0.16);
          --header-bg: rgba(255,255,255,0.8);
          --header-border: rgba(0,0,0,0.06);
          --theme-toggle-bg: rgba(0,0,0,0.05);
        }
        .dark {
          --btn-ghost-bg: rgba(255,255,255,0.04);
          --btn-ghost-border: rgba(255,255,255,0.08);
          --btn-ghost-bg-hover: rgba(255,255,255,0.08);
          --btn-ghost-border-hover: rgba(255,255,255,0.16);
          --header-bg: rgba(4,4,10,0.8);
          --header-border: rgba(255,255,255,0.06);
          --theme-toggle-bg: rgba(255,255,255,0.05);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(99,102,241,0.35); color: #fff; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes pulse-slow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.9;transform:scale(1.06)} }
        @keyframes gradMove { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        @keyframes shimmer-ray { 0%{left:-80%} 100%{left:130%} }
        @keyframes marquee-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes border-glow { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes bounce-subtle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes scale-in { 0%{transform:scale(0.95);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.5);opacity:0} }

        .float { animation: float 5s ease-in-out infinite; }
        .pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }

        .btn-primary {
          position:relative; overflow:hidden;
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 28px; border-radius:8px; border:none; cursor:pointer;
          font-size:15px; font-weight:700; font-family:var(--font-jakarta),sans-serif; letter-spacing:-0.01em;
          background:#6366f1;
          color:#fff; transition:transform 0.2s,box-shadow 0.2s,background 0.2s;
          box-shadow:0 0 40px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
          min-height: 44px; /* Better touch target */
        }
        .btn-primary:hover { 
          transform:translateY(-2px) scale(1.02); 
          background:#5558e3;
          box-shadow:0 0 60px rgba(99,102,241,0.55), inset 0 1px 0 rgba(255,255,255,0.15); 
        }
        .btn-primary:active { transform:translateY(0) scale(0.99); }

        .btn-ghost {
          display:inline-flex; align-items:center; gap:8px;
          padding:14px 28px; border-radius:8px; cursor:pointer;
          font-size:15px; font-weight:600; font-family:var(--font-jakarta),sans-serif; letter-spacing:-0.01em;
          background:var(--btn-ghost-bg); border:1px solid var(--btn-ghost-border);
          color:${t.sub}; transition:all 0.2s;
          backdrop-filter:blur(8px);
          min-height: 44px; /* Better touch target */
        }
        .btn-ghost:hover { background:var(--btn-ghost-bg-hover); color:${t.text}; border-color:var(--btn-ghost-border-hover); }

        .card {
          background:${t.card}; border:1px solid ${t.border};
          border-radius:12px; transition:border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          backdrop-filter:blur(4px); cursor:pointer;
        }
        .card:hover { 
          border-color:rgba(99,102,241,0.5); 
          transform:translateY(-6px) scale(1.02); 
          box-shadow:0 28px 90px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.15); 
        }
        .card:active { transform:translateY(-2px) scale(1.01); }
        .card-hover:hover { border-color:rgba(99,102,241,0.4) !important; }

        .nav-link {
          font-size:14px; font-weight:500; color:${t.sub}; text-decoration:none;
          transition:color 0.2s, transform 0.2s; letter-spacing:-0.005em;
          display:inline-block; position:relative;
        }
        .nav-link:hover { color:${t.text}; transform:translateY(-1px); }
        .nav-link::after {
          content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px;
          background:linear-gradient(90deg,${t.accent},${t.cyan});
          transition:width 0.3s ease;
        }
        .nav-link:hover::after { width:100%; }

        .section { max-width:1160px; margin:0 auto; padding:0 clamp(16px,4vw,32px); }
        .section-pad { padding:clamp(56px,7vw,88px) 0; }
        .label {
          font-family:var(--font-jetbrains),monospace; font-size:11px; font-weight:500;
          letter-spacing:0.14em; text-transform:uppercase; color:${t.accentG};
        }
        .h1 {
          font-family:var(--font-syne),sans-serif; font-size:clamp(44px,7.5vw,92px); font-weight:900;
          line-height:0.97; letter-spacing:-0.04em; color:${t.text};
        }
        .h2 {
          font-family:var(--font-syne),sans-serif; font-size:clamp(32px,4.5vw,58px); font-weight:800;
          line-height:1.06; letter-spacing:-0.03em; color:${t.text};
        }
        .body-lg { font-size:clamp(15px,2vw,18px); line-height:1.7; color:${t.sub}; font-weight:400; }
        .tag {
          display:inline-flex; align-items:center; gap:6px;
          padding:3px 10px; border-radius:6px; font-size:12px; font-weight:600;
          background:rgba(99,102,241,0.15); color:${t.accentG};
          border:1px solid rgba(99,102,241,0.25);
        }
        .shine-border {
          border:1px solid transparent;
          background:linear-gradient(${t.card},${t.card}) padding-box,
            linear-gradient(135deg,rgba(99,102,241,0.6),rgba(34,211,238,0.35),rgba(99,102,241,0.15)) border-box;
          box-shadow:0 0 80px rgba(99,102,241,0.18);
        }
        .desktop-only { display: inline-flex; }
        .marquee-track {
          display:flex; width:max-content;
          animation:marquee-scroll 30s linear infinite;
        }
        .marquee-track:hover { animation-play-state:paused; }
        .grad-divider {
          height:1px; border:none;
          background:linear-gradient(90deg,transparent,rgba(99,102,241,0.35),rgba(34,211,238,0.25),transparent);
        }
        .feature-card-wide { grid-column: span 2; }
        .email-form { display: flex; gap: 12px; width: 100%; max-width: 480px; margin: 0 auto; }
        .email-input {
          flex: 1; min-width: 0;
          background: var(--btn-ghost-bg); border: 1px solid var(--btn-ghost-border);
          border-radius: 8px; color: ${t.text}; font-size: 15px;
          font-family: var(--font-jakarta), sans-serif;
          padding: 14px 18px; outline: none; transition: all 0.3s;
        }
        .email-input::placeholder { color: ${t.muted}; }
        .email-input:focus { 
          border-color: rgba(99,102,241,0.6); 
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1), 0 4px 12px rgba(99,102,241,0.15);
          transform: translateY(-1px);
        }
        .email-form { display:flex; gap:10px; max-width:520px; margin:0 auto; }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width:900px) {
          .desktop-nav { display:none !important; }
          .desktop-only { display:none !important; }
          .desktop-header { display:none !important; }
          .mobile-header { display:block !important; }
          #hamburger { display:flex !important; }
          .feature-card-wide { grid-column: span 1 !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
          .mockup-grid { grid-template-columns: 1fr !important; padding: 20px !important; }
          .mockup-sidebar { display: none !important; }
          .h1 { font-size: clamp(36px, 10vw, 72px) !important; }
          .h2 { font-size: clamp(28px, 8vw, 48px) !important; }
        }
        .dark .mobile-glass-header {
          background: rgba(4,4,10,0.7) !important;
        }
        .dark .mobile-glass-menu {
          background: rgba(4,4,10,0.9) !important;
        }
        @media (max-width:640px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 20px !important; margin-bottom: 24px !important; padding-bottom: 24px !important; }
          .footer-section { padding: 32px 0 20px !important; }
          .footer-brand p { font-size: 13px !important; max-width: 100% !important; }
          .footer-column { margin-bottom: 0 !important; }
          .footer-bottom { font-size: 12px !important; justify-content: center !important; text-align: center !important; }
          .footer-bottom span { font-size: 11px !important; }
          .hero-actions { flex-direction:column; align-items:stretch; }
          .hero-actions > * { text-align:center; justify-content:center; }
          .email-form { flex-direction: column !important; gap: 12px !important; }
          .btn-primary, .btn-ghost { padding:12px 18px !important; width: 100%; white-space: normal !important; text-align: center; font-size: 14px !important; min-height: 42px !important; justify-content: center !important; }
          .section { padding: 0 20px; }
          .h1 { font-size: 36px !important; line-height: 1.1 !important; }
          .h2 { font-size: 28px !important; line-height: 1.15 !important; }
          .body-lg { font-size: 15px !important; }
          .sticky-cta-content { flex-direction: column !important; align-items: stretch !important; padding: 10px 16px !important; gap: 10px !important; }
          .sticky-cta-content > button { width: 100% !important; }
          .sticky-cta-content > span { text-align: center !important; font-size: 13px !important; }
          .comparison-desktop { display: none !important; }
          .comparison-mobile { display: flex !important; }
          .card { padding: 20px !important; }
          .email-input { padding: 12px 16px !important; font-size: 14px !important; }
          .demo-input-wrapper { flex-direction: column !important; gap: 10px !important; }
          .demo-input { width: 100% !important; }
          .demo-btn { width: 100% !important; justify-content: center !important; }
        }
        @media (max-width:480px) {
          .section { padding: 0 16px; }
          .h1 { font-size: 32px !important; }
          .h2 { font-size: 24px !important; }
          table { font-size: 12px !important; }
          table th, table td { padding: 10px 8px !important; }
          .card { padding: 16px !important; border-radius: 10px !important; }
          .btn-primary, .btn-ghost { padding: 10px 16px !important; font-size: 13px !important; min-height: 40px !important; justify-content: center !important; }
          .demo-input { font-size: 13px !important; padding: 10px 14px !important; }
        }
      `}</style>

      {/* ══ NAV ══════════════════════════════════════════ */}
      <motion.header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          borderBottom: scrolled ? "1px solid var(--header-border)" : "1px solid transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          background: scrolled ? "var(--header-bg)" : "transparent",
          transition: "all 0.3s ease",
        }}
        className="desktop-header"
      >
        <div className="section" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          {/* Brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <Logo size={34} />
            <span style={{ fontFamily: "var(--font-syne),sans-serif", fontSize: 20, fontWeight: 900, color: t.text, letterSpacing: "-0.02em" }}>
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
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                  background: "var(--theme-toggle-bg)",
                  border: `1px solid ${t.border}`,
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: t.sub,
                  transition: "all 0.2s"
                }}
                title="Toggle Theme"
                className="desktop-only"
              >
                {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
            )}
            <button onClick={() => router.push(isLoaded && user ? "/dashboard" : "/sign-in")} className="nav-link desktop-only" style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 4px", marginLeft: 4 }}>
              {isLoaded && user ? "Dashboard" : "Sign in"}
            </button>
            {isLoaded && user ? (
              <button onClick={() => router.push("/dashboard")} className="btn-primary desktop-only" style={{ padding: "10px 20px", fontSize: 14 }}>
                Go to Dashboard
              </button>
            ) : (
              <button onClick={() => router.push("/sign-up")} className="btn-primary desktop-only" style={{ padding: "10px 20px", fontSize: 14, boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}>
                Get started free
              </button>
            )}
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
              <button onClick={() => router.push("/sign-up")} className="btn-primary" style={{ marginTop: 8 }}>
                Get started free
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══ MOBILE GLASS HEADER ══════════════════════════ */}
      <motion.header
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          right: 16,
          zIndex: 100,
          display: "none",
        }}
        className="mobile-header"
      >
        <motion.div
          animate={{
            backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(10px) saturate(150%)",
            background: scrolled ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)",
          }}
          className="mobile-glass-header"
          style={{
            border: `1px solid ${t.border}`,
            borderRadius: 20,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/pubwize-icon.png" alt="Pubwize" style={{ width: 32, height: 32 }} />
            <span style={{ fontFamily: "var(--font-syne),sans-serif", fontSize: 18, fontWeight: 900, color: t.text, letterSpacing: "-0.02em" }}>
              Pubwize
            </span>
          </Link>

          {/* Right side: Theme toggle + Hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {mounted && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                style={{
                  background: "var(--theme-toggle-bg)",
                  border: `1px solid ${t.border}`,
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: t.sub,
                  transition: "all 0.2s"
                }}
                title="Toggle Theme"
              >
                {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: t.text,
                padding: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {mobileOpen ? <IconX size={24} /> : <IconMenu size={24} />}
            </motion.button>
          </div>
        </motion.div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                marginTop: 12,
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(20px) saturate(180%)",
                border: `1px solid ${t.border}`,
                borderRadius: 20,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              }}
              className="mobile-glass-menu"
            >
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="nav-link"
                  style={{ fontSize: 16, padding: "8px 0", fontWeight: 600 }}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </a>
              ))}
              <a href="/blog" className="nav-link" style={{ fontSize: 16, padding: "8px 0", fontWeight: 600 }} onClick={() => setMobileOpen(false)}>
                Blog
              </a>
              <div style={{ height: 1, background: t.border, margin: "8px 0" }} />
              {isLoaded && user ? (
                <button
                  onClick={() => {
                    router.push("/dashboard");
                    setMobileOpen(false);
                  }}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      router.push("/sign-in");
                      setMobileOpen(false);
                    }}
                    className="btn-ghost"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      router.push("/sign-up");
                      setMobileOpen(false);
                    }}
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Get started free
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ══ HERO ═════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position: "relative", paddingTop: "clamp(120px,14vw,180px)", paddingBottom: "clamp(80px,10vw,120px)", overflow: "hidden" }}>
        {/* Background orbs */}
        <Orb color={t.accent} size={700} x="-15%" y="-20%" blur={280} />
        <Orb color={t.cyan}   size={500} x="65%"  y="5%"  blur={240} />
        <Orb color="#a78bfa"  size={400} x="30%"  y="60%" blur={260} />
        <GridOverlay />

        <motion.div className="section" style={{ position: "relative", zIndex: 2, textAlign: "center", y: heroY }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Badge>
              <IconSparkle size={12} />
              Built for the AI era of content
            </Badge>
          </motion.div>

          <motion.h1
            className="h1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            style={{ marginTop: 28, marginBottom: 24 }}
          >
            AI content that<br />
            <TypingCycle />
          </motion.h1>

          <motion.p
            className="body-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.16 }}
            style={{ maxWidth: 560, margin: "0 auto 32px" }}
          >
            Pubwize is your AI-first content platform. Generate ranked articles, repurpose to social, and publish to WordPress — all in one workflow.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.24 }}
          >
            {emailSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "16px 28px", borderRadius: 14,
                  background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
                  color: t.green, fontWeight: 600, fontSize: 15,
                  boxShadow: "0 4px 20px rgba(74,222,128,0.2)",
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                >
                  <IconCheck size={18} color={t.green} />
                </motion.div>
                You&apos;re on the list! We&apos;ll be in touch.
              </motion.div>
            ) : (
              <form
                className="email-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) {
                    router.push(`/sign-up?email=${encodeURIComponent(email.trim())}`);
                    setEmailSubmitted(true);
                  }
                }}
              >
                <input
                  type="email"
                  required
                  className="email-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ whiteSpace: "nowrap", padding: "14px 28px" }}>
                  Start Writing Free <IconArrowRight size={15} />
                </button>
              </form>
            )}
            <div style={{ marginTop: 12, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
              {["No credit card", "5 articles free", "Cancel anytime"].map((item) => (
                <span key={item} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.muted }}>
                  <IconCheck size={11} color={t.accentG} />{item}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: `${t.cyan}12`, border: `1px solid ${t.cyan}28`,
                color: t.cyan, letterSpacing: "0.02em",
              }}>
                <IconSparkle size={11} />
                Brand new — we're shipping updates weekly
              </span>
            </div>
          </motion.div>


        </motion.div>


      </section>

      {/* ══ INTERACTIVE DEMO ═════════════════════════════ */}
      <section style={{ padding: "clamp(60px,8vw,100px) 0", background: t.surface, position: "relative", overflow: "hidden" }}>
        <Orb color={t.cyan} size={400} x="80%" y="50%" blur={200} />
        <div className="section" style={{ position: "relative", zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 32 }}
          >
            <div className="label" style={{ marginBottom: 12 }}>Try It Live</div>
            <h2 className="h2">See the magic in action</h2>
            <p className="body-lg" style={{ maxWidth: 480, margin: "10px auto 0" }}>
              Enter any keyword and watch AI generate an SEO-optimized article structure instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            style={{ maxWidth: 680, margin: "0 auto" }}
          >
            <div style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 20,
              padding: "clamp(28px,4vw,40px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 24 }} className="demo-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g., best AI writing tools 2026"
                  value={demoKeyword}
                  onChange={(e) => setDemoKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && demoKeyword.trim()) {
                      setDemoGenerating(true);
                      setTimeout(() => setDemoGenerating(false), 2000);
                    }
                  }}
                  className="email-input demo-input"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => {
                    if (demoKeyword.trim()) {
                      setDemoGenerating(true);
                      setTimeout(() => setDemoGenerating(false), 2000);
                    }
                  }}
                  disabled={!demoKeyword.trim() || demoGenerating}
                  className="btn-primary demo-btn"
                  style={{ 
                    whiteSpace: "nowrap", 
                    opacity: !demoKeyword.trim() ? 0.5 : 1,
                    cursor: !demoKeyword.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {demoGenerating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }}
                      />
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconBolt size={16} /> Generate
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {demoGenerating && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ 
                      background: t.surface, 
                      border: `1px solid ${t.border}`, 
                      borderRadius: 12, 
                      padding: 20,
                      marginTop: 16
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {["Analyzing SERP competitors...", "Extracting keywords...", "Building outline structure..."].map((text, i) => (
                          <motion.div
                            key={text}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2 }}
                            style={{ display: "flex", alignItems: "center", gap: 10 }}
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                              style={{ width: 8, height: 8, borderRadius: "50%", background: t.accent }}
                            />
                            <span style={{ fontSize: 14, color: t.sub }}>{text}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ 
                marginTop: 20, 
                paddingTop: 20, 
                borderTop: `1px solid ${t.border}`,
                textAlign: "center"
              }}>
                <button
                  onClick={() => router.push("/sign-up")}
                  className="btn-ghost"
                  style={{ fontSize: 14 }}
                >
                  Sign up to try the full platform <IconArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ LOGO MARQUEE ══════════════════════════════════ */}
      <LogoMarquee />

      {/* ══ STATS STRIP ══════════════════════════════════ */}
      <section id="stats" style={{ padding: "28px 0", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div className="section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 140px),1fr))", gap: 16, maxWidth: 800, margin: "0 auto" }}>
            {[
              { value: "90s", label: "Generation time" },
              { value: "AI", label: "Powered engine" },
              { value: "SEO", label: "Optimized" },
              { value: "1‑Click", label: "WordPress" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: "12px 8px" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,3.5vw,36px)", fontWeight: 900, color: t.text, letterSpacing: "-0.02em" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: t.sub, marginTop: 2, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════ */}
      <section id="features" style={{ padding: "clamp(56px,7vw,88px) 0" }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div className="label" style={{ marginBottom: 12 }}>Platform Features</div>
            <h2 className="h2">Everything your content<br />team needs to win</h2>
            <p className="body-lg" style={{ maxWidth: 520, margin: "12px auto 0" }}>
              From keyword discovery to ranking — a complete content stack built for modern SEO teams.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: "auto", gap: 16 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              const isWide = f.size === "wide";
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`card${isWide ? " feature-card-wide" : ""}`}
                  style={{ padding: "clamp(24px,3vw,36px)", position: "relative", overflow: "hidden" }}
                >
                  {/* Icon ambient glow */}
                  <div style={{
                    position: "absolute", top: -30, right: -20,
                    width: 140, height: 140, borderRadius: "50%",
                    background: f.color, filter: "blur(60px)", opacity: 0.12, pointerEvents: "none",
                  }} />
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `${f.color}12`,
                      border: `1px solid ${f.color}28`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 22,
                    }}
                  >
                    <Icon size={22} color={f.color} />
                  </motion.div>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 800, color: t.text, marginBottom: 10, letterSpacing: "-0.02em" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.7 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ TRUST BADGES ═════════════════════════════════ */}
      <div style={{ borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, background: t.surface, padding: "14px 0" }}>
        <div className="section" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "12px 32px" }}>
          {[
            { icon: IconShield, label: "SOC 2 Ready", color: t.green },
            { icon: IconGlobe, label: "GDPR Compliant", color: t.cyan },
            { icon: IconCreditCard, label: "No Credit Card", color: t.accent },
            { icon: IconRefresh, label: "Cancel Anytime", color: t.amber },
            { icon: IconZap, label: "< 90s Per Article", color: t.rose },
          ].map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.label} style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 12, fontWeight: 600, color: t.sub, letterSpacing: "0.02em",
              }}>
                <span style={{ color: b.color, display: "flex" }}><Icon size={14} /></span>
                {b.label}
              </div>
            );
          })}
        </div>
      </div>
      <section style={{ padding: "clamp(56px,7vw,88px) 0", background: t.surface }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <div className="label" style={{ marginBottom: 12 }}>The Workflow</div>
            <h2 className="h2">From keyword to rankings<br />in four steps</h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 240px),1fr))", gap: 16 }}>
            {[
              { step: "01", title: "Enter your keyword", desc: "Paste any target keyword or topic. Pubwize analyzes the SERP instantly.", color: t.accent },
              { step: "02", title: "Generate your article", desc: "Our AI produces a structured, keyword-rich article optimized for Google.", color: t.cyan },
              { step: "03", title: "Review & refine", desc: "In-line SEO scoring, readability checks, and one-click fixes.", color: "#a78bfa" },
              { step: "04", title: "Publish & repurpose", desc: "Push to WordPress and generate social posts — all in one click.", color: t.green },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                style={{ padding: "32px 28px", position: "relative" }}
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
      <section id="testimonials" style={{ padding: "clamp(56px,7vw,88px) 0" }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div className="label" style={{ marginBottom: 12 }}>What Users Say</div>
            <h2 className="h2">Built for real content teams</h2>
            <p className="body-lg" style={{ maxWidth: 520, margin: "12px auto 0" }}>
              Join content creators who are scaling their SEO workflows with AI.
            </p>
          </motion.div>
        </div>
      </section>

      <hr className="grad-divider" />

      {/* ══ WHY PUBWIZE (COMPARISON) ══════════════════════ */}
      <section id="comparison" style={{ padding: "clamp(56px,7vw,88px) 0" }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div className="label" style={{ marginBottom: 12 }}>Why Pubwize</div>
            <h2 className="h2">Stop overpaying for<br />mediocre content</h2>
            <p className="body-lg" style={{ maxWidth: 520, margin: "12px auto 0" }}>
              See how Pubwize stacks up against DIY AI prompting and traditional content agencies.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {/* Desktop table */}
            <div className="comparison-desktop" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 14, fontWeight: 600, color: t.sub, borderBottom: `1px solid ${t.border}` }}></th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: 13, fontWeight: 800, color: t.text, borderBottom: `1px solid ${t.border}`, background: "rgba(99,102,241,0.08)", borderRadius: "12px 12px 0 0", fontFamily: "'Syne',sans-serif" }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <IconBolt size={14} color={t.accent} /> Pubwize
                      </span>
                    </th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: 13, fontWeight: 600, color: t.sub, borderBottom: `1px solid ${t.border}` }}>DIY AI</th>
                    <th style={{ padding: "16px 20px", textAlign: "center", fontSize: 13, fontWeight: 600, color: t.sub, borderBottom: `1px solid ${t.border}` }}>Agency</th>
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
            </div>

            {/* Mobile cards */}
            <div className="comparison-mobile" style={{ display: "none", flexDirection: "column", gap: 20 }}>
              {[
                { name: "Pubwize", key: "pubwize" as const, highlight: true },
                { name: "DIY AI Prompts", key: "diy" as const, highlight: false },
                { name: "Content Agency", key: "agency" as const, highlight: false },
              ].map((option) => (
                <motion.div
                  key={option.key}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={option.highlight ? "card shine-border" : "card"}
                  style={{ padding: "24px" }}
                >
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8, 
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: `1px solid ${t.border}`
                  }}>
                    {option.highlight && <IconBolt size={18} color={t.accent} />}
                    <h3 style={{ 
                      fontFamily: "'Syne',sans-serif", 
                      fontSize: 20, 
                      fontWeight: 800, 
                      color: t.text 
                    }}>
                      {option.name}
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {comparisonRows.map((row) => {
                      const val = row[option.key];
                      return (
                        <div key={row.feature} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 14, color: t.sub, flex: 1 }}>{row.feature}</span>
                          <div>
                            {typeof val === "boolean" ? (
                              val ? <IconCheck size={16} color={t.green} /> : <IconX size={14} color={t.muted} />
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 700, color: option.highlight ? t.green : t.sub }}>{val}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <hr className="grad-divider" />

      {/* ══ PRICING ══════════════════════════════════════ */}
      <section id="pricing" style={{ padding: "clamp(56px,7vw,88px) 0", background: t.surface }} className="pricing-section">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <div className="label" style={{ marginBottom: 12 }}>Pricing</div>
            <h2 className="h2">Simple, transparent pricing</h2>
            <p className="body-lg" style={{ maxWidth: 440, margin: "10px auto 0" }}>Start free. Scale when you're ready. No hidden fees, no contracts.</p>
          </motion.div>

          <PricingCards
            key={theme}
            currentPlan="free"
            onSuccess={() => router.push("/dashboard")}
          />
        </div>
      </section>

      {/* Force theme-aware styling */}
      <style jsx global>{`
        .pricing-section {
          color-scheme: light dark;
        }
        .dark .pricing-section .bg-card {
          background: var(--card) !important;
        }
        .dark .pricing-section .border-border {
          border-color: var(--border) !important;
        }
        .dark .pricing-section .text-text-1 {
          color: var(--text-1) !important;
        }
        .dark .pricing-section .text-text-2 {
          color: var(--text-2) !important;
        }
        .dark .pricing-section .text-text-3 {
          color: var(--text-3) !important;
        }
      `}</style>

      {/* ══ CTA ══════════════════════════════════════════ */}
      <section style={{ padding: "clamp(56px,7vw,88px) 0", position: "relative", overflow: "hidden" }}>
        <Orb color={t.accent} size={600} x="50%" y="50%" blur={300} />
        <Orb color={t.cyan} size={400} x="70%" y="20%" blur={250} />
        <div className="section" style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="label" style={{ marginBottom: 16 }}>Get started today</div>
            <h2 className="h2" style={{ maxWidth: 640, margin: "0 auto 16px" }}>
              Ready to scale your content operation?
            </h2>
            <p className="body-lg" style={{ maxWidth: 480, margin: "0 auto 32px" }}>
              Start creating SEO-optimized content with AI. No credit card required.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => router.push("/sign-up")} className="btn-primary" style={{ fontSize: 16, padding: "18px 44px" }}>
                Start for free — no card needed
              </button>
            </div>
            <div style={{ display: "flex", gap: 28, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
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
      <section id="faq" style={{ padding: "clamp(56px,7vw,88px) 0", background: t.surface }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 36 }}
          >
            <div className="label" style={{ marginBottom: 12 }}>FAQ</div>
            <h2 className="h2">Got questions?</h2>
            <p className="body-lg" style={{ maxWidth: 480, margin: "10px auto 0" }}>Everything you need to know about Pubwize.</p>
          </motion.div>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ BLOG PREVIEW ═══════════════════════════════ */}
      <section style={{ padding: "clamp(40px,5vw,56px) 0", borderTop: `1px solid ${t.border}` }}>
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 28 }}
          >
            <div className="label" style={{ marginBottom: 10 }}>Latest from the Blog</div>
            <h2 className="h2" style={{ fontSize: "clamp(24px,3vw,32px)" }}>SEO insights & guides</h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 260px),1fr))", gap: 20, maxWidth: 900, margin: "0 auto" }}>
            {[
              { title: "How to Rank a New Article in 30 Days", slug: "rank-new-article-30-days", date: "Mar 5" },
              { title: "Why AI-Generated Content Ranks (When Done Right)", slug: "ai-content-that-ranks", date: "Mar 10" },
              { title: "Pillar & Cluster Strategy: How to Dominate a Niche with AI", slug: "pillar-cluster-strategy", date: "Mar 16" },
            ].map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{
                  display: "block", textDecoration: "none",
                  padding: "24px", borderRadius: 8,
                  background: t.card, border: `1px solid ${t.border}`,
                  transition: "border-color 0.3s",
                }}
                className="card-hover"
              >
                <div style={{ fontSize: 11, color: t.muted, marginBottom: 8, fontWeight: 500 }}>{post.date}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, lineHeight: 1.4, letterSpacing: "-0.01em" }}>{post.title}</h3>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: t.accentG, fontWeight: 600 }}>
                  Read more <IconArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${t.border}`, background: t.surface, padding: "56px 0 32px" }} className="footer-section">
        <div className="section">
          {/* Footer grid */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40, paddingBottom: 32, borderBottom: `1px solid ${t.border}` }} className="footer-grid">
            {/* Brand */}
            <div className="footer-brand">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Logo size={30} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 900, color: t.text, letterSpacing: "-0.02em" }}>Pubwize</span>
              </div>
              <p style={{ fontSize: 14, color: t.sub, lineHeight: 1.7, maxWidth: 280 }}>
                AI-powered SEO content platform. From keyword to published post in minutes.
              </p>
            </div>
            {/* Product */}
            <div className="footer-column">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.text, marginBottom: 12 }}>Product</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["Features","#features"],["Pricing","#pricing"],["Blog","/blog"]].map(([label, href]) => (
                  <a key={label} href={href} className="nav-link" style={{ fontSize: 13 }}>{label}</a>
                ))}
              </div>
            </div>
            {/* Legal */}
            <div className="footer-column">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.text, marginBottom: 12 }}>Legal</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["Terms","/terms"],["Privacy","/privacy"]].map(([label, href]) => (
                  <a key={label} href={href} className="nav-link" style={{ fontSize: 13 }}>{label}</a>
                ))}
              </div>
            </div>
            {/* Support */}
            <div className="footer-column">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: t.text, marginBottom: 12 }}>Support</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="/contact" className="nav-link" style={{ fontSize: 13 }}>Contact</a>
              </div>
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }} className="footer-bottom">
            <span style={{ fontSize: 13, color: t.muted }}>© 2026 Pubwize · DraftRapid</span>
            <span style={{ fontSize: 13, color: t.muted }}>v2.0</span>
          </div>
        </div>
      </footer>

      {/* ══ BACK TO TOP ══════════════════════════════════ */}
      <AnimatePresence>
        {showUp && (
          <>
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                position: "fixed", bottom: 100, right: 28, zIndex: 999,
                width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${t.accent}, ${t.cyan})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
                color: "#fff",
              }}
            >
              <IconChevronUp />
            </motion.button>

            {/* Help button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              style={{ position: "fixed", bottom: 160, right: 28, zIndex: 999 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/contact")}
                style={{
                  width: 44, height: 44, borderRadius: "50%", border: `1px solid ${t.border}`,
                  cursor: "pointer", background: t.card, display: "flex", alignItems: "center",
                  justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  color: t.text, fontSize: 20, fontWeight: 700,
                }}
              >
                ?
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ STICKY BOTTOM CTA BAR ═══════════════════════ */}
      <AnimatePresence>
        {showUp && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 998,
              background: t.surface,
              backdropFilter: "blur(24px) saturate(180%)",
              borderTop: `1px solid ${t.border}`,
              padding: "12px clamp(16px,4vw,24px)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, flexWrap: "wrap",
            }}
            className="sticky-cta-content"
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
              Generate your first article free
            </span>
            <button
              onClick={() => router.push("/sign-up")}
              className="btn-primary"
              style={{ fontSize: 13, padding: "10px 20px", whiteSpace: "nowrap" }}
            >
              Start Free
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
