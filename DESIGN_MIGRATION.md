# Design System Migration - Landing Page to App

## ✅ Completed

### Core Design System
- ✅ Created `/lib/design-system.ts` with centralized design tokens
- ✅ Updated `globals.css` with new color palette
- ✅ Changed fonts from DM Serif/Manrope to **Syne/Plus Jakarta Sans/JetBrains Mono**
- ✅ Updated dark mode colors to match landing page (#04040a background, #6366f1 primary)
- ✅ Updated all CSS custom properties and design tokens

### Color Palette Migration
**Old → New:**
- Gold (#F5A623) → Indigo (#6366f1)
- Teal (#00D9B4) → Cyan (#22d3ee)
- Lilac (#9B8DFF) → Purple (#a78bfa)
- Background (#07070d) → Deeper black (#04040a)
- Surface (#0e0e1a) → (#090912)
- Card (#15152a) → (#0d0d1e)

### Updated Components (CSS)
- ✅ `.btn-gold` - Now uses indigo→cyan gradient with animation
- ✅ `.badge-gold`, `.badge-teal`, `.badge-lilac` - Updated colors
- ✅ `.card-premium` - Updated hover states and borders
- ✅ `.sb-*` (sidebar) - All sidebar styles updated
- ✅ `.dlw-*` (dashboard layout) - Loading states updated
- ✅ Aurora background gradients
- ✅ Typography utilities
- ✅ Gradient text utilities

### Animations Added
- ✅ `float` - Floating animation
- ✅ `pulse-slow` - Slow pulse effect
- ✅ `shimmer` - Shimmer effect
- ✅ `gradMove` - Gradient movement (used in buttons)

## 🔄 Next Steps

### Component Updates Needed

1. **Button Component** (`components/ui/button.tsx`)
   - Update primary variant to use new gradient
   - Add animation classes

2. **Badge Component** (`components/ui/badge.tsx`)
   - Update color variants to match new palette

3. **Card Component** (`components/ui/card.tsx`)
   - Ensure border-radius matches (20px for cards)
   - Update hover effects

4. **Dashboard Pages**
   - `/app/dashboard/page.tsx` - Update stat cards, CTAs
   - `/app/dashboard/articles/page.tsx` - Update article cards
   - `/app/dashboard/sites/page.tsx` - Update site cards
   - `/app/dashboard/settings/page.tsx` - Update form styling

5. **Article Editor** (`components/article-editor/*`)
   - Update panel backgrounds
   - Update button styles
   - Update badge colors

6. **Auth Pages** (`app/auth/*`)
   - Update to match landing page aesthetic
   - Use new gradient buttons
   - Update card styling

7. **Modals & Dialogs**
   - Update all modal backgrounds
   - Update button styles
   - Update border colors

## Design Tokens Reference

```typescript
// From lib/design-system.ts
designTokens = {
  bg: "#04040a",
  surface: "#090912",
  card: "#0d0d1e",
  border: "rgba(255,255,255,0.06)",
  borderH: "rgba(99,102,241,0.4)",
  accent: "#6366f1",
  accentG: "#818cf8",
  cyan: "#22d3ee",
  rose: "#f43f5e",
  green: "#4ade80",
  amber: "#fbbf24",
  text: "#f8fafc",
  sub: "#94a3b8",
  muted: "#334155",
}
```

## Typography

- **Display/Headings:** `'Syne', sans-serif` (800-900 weight)
- **Body:** `'Plus Jakarta Sans', 'Inter', sans-serif` (400-700 weight)
- **Code/Labels:** `'JetBrains Mono', monospace` (400-500 weight)

## Key Visual Elements

1. **Gradient Buttons:** `linear-gradient(135deg, #6366f1, #818cf8, #22d3ee)` with `gradMove` animation
2. **Card Borders:** `rgba(255,255,255,0.06)` default, `rgba(99,102,241,0.4)` on hover
3. **Border Radius:** 12px (buttons), 16-20px (cards), 999px (badges)
4. **Shadows:** Indigo glow `rgba(99,102,241,0.35)` instead of gold
5. **Icons:** Use Lucide React (already in use)

## Migration Strategy

1. ✅ **Phase 1:** Core CSS & Design System (DONE)
2. **Phase 2:** Update UI components (`components/ui/*`)
3. **Phase 3:** Update dashboard pages
4. **Phase 4:** Update article editor
5. **Phase 5:** Update auth pages
6. **Phase 6:** Update modals/dialogs
7. **Phase 7:** Final polish & consistency check

## Testing Checklist

- [ ] Dark mode looks consistent across all pages
- [ ] Buttons have proper gradient animation
- [ ] Cards have proper hover effects
- [ ] Sidebar navigation highlights correctly
- [ ] Loading states use new colors
- [ ] All badges use new color scheme
- [ ] Typography is consistent (Syne for headings)
- [ ] Gradients render smoothly
- [ ] Mobile responsive (all breakpoints)
- [ ] Accessibility (contrast ratios maintained)
