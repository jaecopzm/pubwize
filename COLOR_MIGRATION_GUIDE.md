# Pubwize Color Scheme Migration Guide

## Overview
Migrating from gold/teal theme to primary (indigo)/cyan theme for a more modern, cohesive look.

## Color Mappings

### Primary Colors
- `gold` → `primary` (indigo #6366f1)
- `teal` → `cyan-500` (#22d3ee) or `emerald-500` for success states
- `lilac` → `violet-500` or `purple-500`

### CSS Classes to Replace

#### Text Colors
```bash
text-gold → text-primary
text-teal → text-cyan-500
text-lilac → text-violet-500
```

#### Background Colors
```bash
bg-gold → bg-primary
bg-gold/10 → bg-primary/10
bg-gold/15 → bg-primary/15
bg-gold/20 → bg-primary/20

bg-teal → bg-cyan-500
bg-teal/10 → bg-cyan-500/10
bg-teal/15 → bg-cyan-500/15
```

#### Border Colors
```bash
border-gold → border-primary
border-gold/20 → border-primary/20
border-gold/30 → border-primary/30

border-teal → border-cyan-500
border-teal/20 → border-cyan-500/20
```

#### Gradients
```bash
from-gold → from-primary
to-gold → to-primary
from-teal → from-cyan-500
to-teal → to-cyan-500

gradient-gold-teal → bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent
```

#### Shadow Colors
```bash
shadow-gold → shadow-primary
shadow-gold/10 → shadow-primary/10
shadow-gold/20 → shadow-primary/20
```

### Component Classes

#### Button (btn-gold)
Replace:
```tsx
className="btn-gold"
```

With:
```tsx
className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95"
```

Or create a reusable component:
```tsx
// components/ui/button-primary.tsx
export function ButtonPrimary({ children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

#### Badge (badge-gold)
Replace:
```tsx
className="badge-gold"
```

With:
```tsx
className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
```

### Files to Update (Priority Order)

1. **Dashboard Pages** (High Priority)
   - ✅ `/app/dashboard/settings/page.tsx` - DONE
   - ✅ `/app/dashboard/analytics/page.tsx` - DONE (new component)
   - `/app/dashboard/page.tsx` - Overview page
   - `/app/dashboard/articles/page.tsx` - Articles list
   - `/app/dashboard/articles/[id]/page.tsx` - Article editor
   - `/app/dashboard/articles/new/page.tsx` - New article
   - `/app/dashboard/sites/page.tsx` - Sites list
   - `/app/dashboard/calendar/page.tsx` - Calendar
   - `/app/dashboard/research/page.tsx` - Research

2. **Components** (High Priority)
   - `/components/article-editor/*.tsx` - All editor components
   - `/components/pricing/*.tsx` - Pricing components
   - `/components/wordpress/*.tsx` - WordPress components
   - `/components/onboarding/*.tsx` - Onboarding components

3. **Landing & Marketing** (Medium Priority)
   - `/app/page.tsx` - Landing page (keep current design)
   - `/components/landing/*.tsx` - Landing components

4. **Admin Pages** (Low Priority)
   - `/app/admin/*.tsx` - Admin pages

### Automated Replacement Script

```bash
#!/bin/bash

# Run from project root
cd /home/jaeycop/projects/pubwize

# Backup first
tar -czf ~/pubwize-backup-$(date +%Y%m%d-%H%M%S).tar.gz app components

# Replace text colors
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-gold/text-primary/g' {} +
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/text-teal/text-cyan-500/g' {} +

# Replace background colors
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-gold/bg-primary/g' {} +
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/bg-teal/bg-cyan-500/g' {} +

# Replace border colors
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/border-gold/border-primary/g' {} +
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/border-teal/border-cyan-500/g' {} +

# Replace gradients
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/from-gold/from-primary/g' {} +
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/to-gold/to-primary/g' {} +
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/from-teal/from-cyan-500/g' {} +
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/to-teal/to-cyan-500/g' {} +

# Replace shadows
find app/dashboard components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/shadow-gold/shadow-primary/g' {} +

echo "Color replacement complete!"
echo "Please review changes and test thoroughly."
```

### Manual Review Required

After running the automated script, manually review:

1. **Gradient combinations** - Some gradients may need adjustment
2. **Hover states** - Ensure hover effects still look good
3. **Contrast ratios** - Check accessibility with new colors
4. **Icon colors** - Update icon colors to match
5. **Chart colors** - Update data visualization colors

### Testing Checklist

- [ ] Dashboard overview page
- [ ] Articles list and editor
- [ ] Settings page (all tabs)
- [ ] Analytics page
- [ ] Sites management
- [ ] Calendar view
- [ ] Research page
- [ ] Pricing cards
- [ ] WordPress integration
- [ ] Dark mode compatibility
- [ ] Mobile responsiveness

### CSS Variables (globals.css)

Update the CSS variables in `app/globals.css`:

```css
:root {
  /* Keep existing primary colors */
  --primary: oklch(0.52 0.27 293); /* Indigo */
  
  /* Update custom colors */
  --gold: #6366f1; /* Now maps to indigo */
  --teal: #22d3ee; /* Now maps to cyan */
  --lilac: #a78bfa; /* Violet */
}

.dark {
  --gold: #818cf8; /* Lighter indigo for dark mode */
  --teal: #22d3ee; /* Cyan stays same */
}
```

## Next Steps

1. ✅ Settings page enhanced with Framer Motion
2. ✅ Analytics page created with premium design
3. Run the automated replacement script
4. Manual review of complex components
5. Test all pages in light/dark mode
6. Update documentation and style guide
