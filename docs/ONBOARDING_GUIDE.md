# User Onboarding Implementation Guide

## Overview
Comprehensive onboarding system with welcome modal, interactive tour, quick start guide, and feature tooltips. Fully responsive and sleek design.

## Components

### 1. Welcome Modal (`components/onboarding/welcome-modal.tsx`)
First-time user welcome experience with two steps:
- **Welcome Step**: Greeting with stats and call-to-action
- **Features Step**: Overview of key features

**Features**:
- Responsive design (mobile-first)
- Smooth animations
- Two-step flow
- Skip option
- Personalized greeting

**Usage**:
```tsx
<WelcomeModal
  isOpen={showWelcome}
  onClose={() => setShowWelcome(false)}
  onStartTour={() => {
    setShowWelcome(false);
    startTour();
  }}
  userName="John"
/>
```

### 2. Onboarding Tour (`components/onboarding/onboarding-tour.tsx`)
Interactive tour with spotlight and tooltips.

**Features**:
- Spotlight effect on target elements
- Smooth transitions
- Progress tracking
- Navigation (next/previous)
- Responsive positioning
- Mobile-optimized
- Custom actions per step

**Usage**:
```tsx
<OnboardingTour
  isActive={isActive}
  currentStep={currentStep}
  steps={tourSteps}
  onNext={handleNext}
  onPrevious={handlePrevious}
  onDismiss={handleDismiss}
  isFirstStep={currentStep === 0}
  isLastStep={currentStep === steps.length - 1}
  progress={progress}
/>
```

### 3. Quick Start Guide (`components/onboarding/quick-start-guide.tsx`)
Collapsible checklist with step-by-step instructions.

**Features**:
- Progress tracking
- Collapsible/expandable
- Step completion tracking
- Action buttons
- Completion celebration
- Persistent state (localStorage)

**Usage**:
```tsx
<QuickStartGuide
  onStepComplete={(stepId) => {
    console.log('Step completed:', stepId);
  }}
/>
```

### 4. Feature Tooltip (`components/onboarding/feature-tooltip.tsx`)
Contextual tooltips for feature discovery.

**Features**:
- Auto-show after delay
- Dismissible
- Positioned relative to element
- One-time show (localStorage)
- Responsive
- Smooth animations

**Usage**:
```tsx
<FeatureTooltip
  id="ai-improve"
  title="AI Improvements"
  description="Use AI to improve your content"
  position="bottom"
  delay={1000}
>
  <button>AI Improve</button>
</FeatureTooltip>
```

### 5. Onboarding Hook (`lib/hooks/use-onboarding.ts`)
State management for onboarding flow.

**Features**:
- Step navigation
- Progress tracking
- Completion tracking
- Persistent state
- Reset functionality

**Usage**:
```tsx
const onboarding = useOnboarding(tourSteps);

// Start tour
onboarding.start();

// Navigate
onboarding.next();
onboarding.previous();
onboarding.goToStep(2);

// Dismiss
onboarding.dismiss();

// Check state
onboarding.isActive;
onboarding.currentStep;
onboarding.progress;
```

## Tour Configurations

### Dashboard Tour (`lib/onboarding/dashboard-tour.ts`)
Main dashboard tour with 7 steps:
1. Welcome to Dashboard
2. Create Article
3. Articles List
4. Keyword Research
5. Content Calendar
6. WordPress Sites
7. Settings & Usage

### Article Editor Tour
Editor-specific tour with 5 steps:
1. Editor Welcome
2. SEO Score
3. Content Editor
4. AI Improvements
5. Publish to WordPress

### Research Tour
Research page tour with 5 steps:
1. Research Welcome
2. Search Input
3. Keyword Results
4. Filters
5. Generate Articles

## Implementation

### Step 1: Add Data Attributes
Add `data-tour` attributes to elements you want to highlight:

```tsx
// Dashboard
<div data-tour="dashboard">Dashboard Content</div>
<button data-tour="create-article">Create Article</button>
<nav data-tour="articles-list">Articles</nav>

// Article Editor
<div data-tour="editor">Editor</div>
<div data-tour="seo-score">SEO Score</div>
<div data-tour="content">Content</div>
```

### Step 2: Wrap Dashboard with Provider
```tsx
// app/dashboard/layout.tsx
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';

export default function DashboardLayout({ children }) {
  return (
    <OnboardingProvider userName={user?.displayName}>
      {children}
    </OnboardingProvider>
  );
}
```

### Step 3: Add Quick Start Guide
```tsx
// app/dashboard/page.tsx
import { QuickStartGuide } from '@/components/onboarding';

export default function DashboardPage() {
  return (
    <div>
      <QuickStartGuide />
      {/* Rest of dashboard */}
    </div>
  );
}
```

### Step 4: Add Feature Tooltips
```tsx
import { FeatureTooltip } from '@/components/onboarding';

<FeatureTooltip
  id="ai-improve"
  title="Try AI Improvements"
  description="Click here to improve your content with AI"
  position="bottom"
>
  <button>AI Improve</button>
</FeatureTooltip>
```

## Responsive Design

### Mobile Optimizations
- Smaller text sizes (text-xs on mobile, text-sm on desktop)
- Compact padding (p-4 on mobile, p-6 on desktop)
- Touch-friendly buttons (44x44px minimum)
- Simplified layouts on small screens
- Horizontal scrolling for long content
- Bottom-positioned tooltips on mobile

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### CSS Classes Used
```css
/* Mobile-first approach */
text-xs sm:text-sm md:text-base
p-4 sm:p-6 md:p-8
gap-2 sm:gap-3 md:gap-4
w-full sm:w-auto
flex-col sm:flex-row
```

## Animations

### Entry Animations
- `animate-fade-in` - Fade in
- `animate-slide-in-up` - Slide up with fade
- `animate-scale-bounce` - Scale bounce effect

### Transitions
- Smooth transitions with `cubic-bezier(0.4, 0, 0.2, 1)`
- 300ms duration for most animations
- Spotlight transitions on tour navigation

### Performance
- CSS animations (GPU-accelerated)
- `will-change` for smooth animations
- Debounced resize handlers
- Lazy loading of tour steps

## Accessibility

### Keyboard Navigation
- Tab through interactive elements
- Enter/Space to activate buttons
- Escape to dismiss modals/tooltips

### Screen Readers
- Proper ARIA labels
- Role attributes
- Live regions for status updates

### Focus Management
- Focus trap in modals
- Return focus after dismissal
- Visible focus indicators

## Customization

### Colors
Uses CSS variables for theming:
```css
--gold: #D4AF37
--teal: #14B8A6
--text-1: Primary text
--text-2: Secondary text
--text-3: Tertiary text
```

### Timing
```typescript
// Welcome modal delay
setTimeout(() => setShowWelcome(true), 500);

// Feature tooltip delay
<FeatureTooltip delay={1000} />

// Animation duration
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Content
Edit tour steps in `lib/onboarding/dashboard-tour.ts`:
```typescript
export const dashboardTourSteps: OnboardingStep[] = [
  {
    id: 'step-1',
    title: 'Step Title',
    description: 'Step description',
    target: '[data-tour="element"]',
    position: 'bottom',
    action: {
      label: 'Action Label',
      onClick: () => { /* action */ },
    },
  },
];
```

## Best Practices

### 1. Keep Tours Short
- 5-7 steps maximum
- Focus on key features only
- Allow skipping

### 2. Progressive Disclosure
- Show basic features first
- Advanced features later
- Context-specific tours

### 3. Timing
- Show welcome modal after page load
- Delay feature tooltips (1-2 seconds)
- Don't interrupt user actions

### 4. Persistence
- Save completion state
- Don't show again after dismissal
- Allow manual restart

### 5. Mobile-First
- Design for mobile first
- Test on real devices
- Touch-friendly targets

## Testing

### Manual Testing Checklist
- [ ] Welcome modal appears for new users
- [ ] Tour highlights correct elements
- [ ] Navigation works (next/previous)
- [ ] Progress tracking accurate
- [ ] Dismissal works
- [ ] State persists across sessions
- [ ] Responsive on all screen sizes
- [ ] Tooltips position correctly
- [ ] Quick start guide tracks completion
- [ ] Animations smooth

### Reset for Testing
```typescript
// Clear all onboarding state
localStorage.removeItem('pubwize_onboarding');
localStorage.removeItem('pubwize_quickstart');
localStorage.removeItem('pubwize_tooltip_*');

// Or use the reset function
onboarding.reset();
```

## Analytics

Track onboarding completion:
```typescript
// In onboarding hook
onSuccess: (stepId) => {
  // Track with your analytics
  analytics.track('Onboarding Step Completed', {
    stepId,
    stepNumber: currentStep + 1,
    totalSteps: steps.length,
  });
};
```

## Troubleshooting

### Tour not showing
- Check if `data-tour` attributes are present
- Verify element is visible in DOM
- Check localStorage for dismissed state

### Tooltip positioning wrong
- Ensure parent has proper positioning
- Check viewport boundaries
- Adjust position prop

### State not persisting
- Check localStorage is enabled
- Verify storage key is correct
- Check for errors in console

## Future Enhancements

### Short Term
- [ ] Video tutorials
- [ ] Interactive demos
- [ ] Contextual help
- [ ] Search in help

### Long Term
- [ ] Personalized tours based on user role
- [ ] A/B testing different flows
- [ ] Analytics dashboard
- [ ] Multi-language support

## Resources

- [React Tour Library](https://github.com/elrumordelaluz/reactour)
- [Onboarding Best Practices](https://www.appcues.com/blog/user-onboarding-best-practices)
- [Mobile UX Guidelines](https://material.io/design/platform-guidance/android-onboarding.html)

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Test with reset state
4. Check browser console for errors
