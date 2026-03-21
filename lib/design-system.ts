/* ══════════════════════════════════════════════════════════════════════════
   Pubwize Design System
   Extracted from /land page - unified tokens for entire app
   ══════════════════════════════════════════════════════════════════════════ */

export const designTokens = {
  // Core colors
  bg: "#04040a",
  surface: "#090912",
  card: "#0d0d1e",
  border: "rgba(255,255,255,0.06)",
  borderH: "rgba(99,102,241,0.4)",
  
  // Accent colors
  accent: "#6366f1",   // indigo electric
  accentG: "#818cf8",  // lighter indigo
  cyan: "#22d3ee",
  rose: "#f43f5e",
  green: "#4ade80",
  amber: "#fbbf24",
  
  // Text
  text: "#f8fafc",
  sub: "#94a3b8",
  muted: "#334155",
} as const;

export const fonts = {
  display: "'Syne', sans-serif",
  body: "'Plus Jakarta Sans', 'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const animations = {
  float: "float 5s ease-in-out infinite",
  pulseSlow: "pulse-slow 3s ease-in-out infinite",
  shimmer: "shimmer 2s infinite",
  gradMove: "gradMove 4s ease infinite",
} as const;

export const gradients = {
  primary: `linear-gradient(135deg, ${designTokens.accent}, ${designTokens.cyan})`,
  accent: `linear-gradient(135deg, ${designTokens.accent}, ${designTokens.accentG}, ${designTokens.cyan})`,
  card: `linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))`,
} as const;
