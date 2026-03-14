# Onboarding Implementation Example

## Quick Start - Add to Your Dashboard

### Step 1: Add Data Attributes to Dashboard

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div data-tour="dashboard" className="p-6">
      {/* Quick Start Guide */}
      <QuickStartGuide />

      {/* Create Article Button */}
      <button 
        data-tour="create-article"
        className="btn-primary"
      >
        Create Article
      </button>

      {/* Articles Section */}
      <div data-tour="articles-list">
        <h2>Your Articles</h2>
        {/* Articles list */}
      </div>
    </div>
  );
}
```

### Step 2: Add Data Attributes to Sidebar

```tsx
// components/dashboard/app-sidebar.tsx
<SidebarMenu>
  <SidebarMenuItem data-tour="research">
    <SidebarMenuButton asChild>
      <Link href="/dashboard/research">
        <Search className="h-4 w-4" />
        <span>Research</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>

  <SidebarMenuItem data-tour="calendar">
    <SidebarMenuButton asChild>
      <Link href="/dashboard/calendar">
        <Calendar className="h-4 w-4" />
        <span>Calendar</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>

  <SidebarMenuItem data-tour="sites">
    <SidebarMenuButton asChild>
      <Link href="/dashboard/sites">
        <Globe className="h-4 w-4" />
        <span>Sites</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>

  <SidebarMenuItem data-tour="settings">
    <SidebarMenuButton asChild>
      <Link href="/dashboard/settings">
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
</SidebarMenu>
```

### Step 3: Wrap Dashboard Layout

```tsx
// app/dashboard/layout.tsx
import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { getFirebaseAuth } from '@/lib/firebase-client';

export default function DashboardLayout({ children }) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  return (
    <OnboardingProvider userName={user?.displayName || undefined}>
      <div className="flex h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </OnboardingProvider>
  );
}
```

### Step 4: Add Feature Tooltips

```tsx
// Example: AI Improve Button
import { FeatureTooltip } from '@/components/onboarding';

<FeatureTooltip
  id="ai-improve"
  title="AI Improvements"
  description="Use AI to fix grammar, improve readability, or regenerate sections"
  position="bottom"
  delay={2000}
>
  <button className="btn-secondary">
    <Sparkles className="h-4 w-4" />
    AI Improve
  </button>
</FeatureTooltip>
```

### Step 5: Add Manual Tour Trigger

```tsx
// Add a help button to restart tour
import { useOnboarding } from '@/lib/hooks/use-onboarding';
import { dashboardTourSteps } from '@/lib/onboarding/dashboard-tour';

function HelpButton() {
  const onboarding = useOnboarding(dashboardTourSteps);

  return (
    <button
      onClick={() => onboarding.start()}
      className="btn-ghost"
      title="Start Tour"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Help</span>
    </button>
  );
}
```

## Complete Example - Dashboard Page

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, TrendingUp, FileText, Clock } from 'lucide-react';
import { QuickStartGuide } from '@/components/onboarding';
import { FeatureTooltip } from '@/components/onboarding';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalArticles: 0,
    published: 0,
    drafts: 0,
  });

  return (
    <div data-tour="dashboard" className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1">
            Welcome back! Here's your content overview.
          </p>
        </div>

        {/* Create Article Button with Tooltip */}
        <FeatureTooltip
          id="create-article-cta"
          title="Create Your First Article"
          description="Click here to generate an SEO-optimized article in under 2 minutes"
          position="bottom"
          delay={3000}
        >
          <button
            data-tour="create-article"
            onClick={() => router.push('/dashboard/articles/new')}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--gold)] to-[var(--teal)] text-white rounded-xl hover:scale-105 transition-transform shadow-lg touch-manipulation"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </button>
        </FeatureTooltip>
      </div>

      {/* Quick Start Guide */}
      <QuickStartGuide />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--gold)]/20 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-[var(--gold)]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-1)]">
                {stats.totalArticles}
              </div>
              <div className="text-xs text-[var(--text-3)]">
                Total Articles
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--teal)]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[var(--teal)]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-1)]">
                {stats.published}
              </div>
              <div className="text-xs text-[var(--text-3)]">
                Published
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--gold)]/20 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-[var(--gold)]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--text-1)]">
                {stats.drafts}
              </div>
              <div className="text-xs text-[var(--text-3)]">
                Drafts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div data-tour="articles-list">
        <h2 className="text-xl font-bold text-[var(--text-1)] mb-4">
          Recent Articles
        </h2>
        {/* Articles list component */}
      </div>
    </div>
  );
}
```

## Testing the Onboarding

### 1. Test as New User
```typescript
// Clear localStorage to simulate new user
localStorage.clear();

// Reload page
window.location.reload();

// Should see:
// 1. Welcome modal after 500ms
// 2. Option to start tour
// 3. Quick start guide visible
```

### 2. Test Tour Navigation
```typescript
// Start tour manually
const onboarding = useOnboarding(dashboardTourSteps);
onboarding.start();

// Navigate through steps
onboarding.next();
onboarding.previous();

// Check progress
console.log(onboarding.progress); // 0-100
console.log(onboarding.currentStep); // 0-6
```

### 3. Test Feature Tooltips
```typescript
// Clear tooltip state
localStorage.removeItem('pubwize_tooltip_ai-improve');

// Reload and wait for delay
// Tooltip should appear after specified delay
```

### 4. Reset Everything
```typescript
// Reset all onboarding state
localStorage.removeItem('pubwize_onboarding');
localStorage.removeItem('pubwize_quickstart');
Object.keys(localStorage)
  .filter(key => key.startsWith('pubwize_tooltip_'))
  .forEach(key => localStorage.removeItem(key));

window.location.reload();
```

## Customization Examples

### Custom Tour Step with Action
```typescript
{
  id: 'custom-step',
  title: 'Try This Feature',
  description: 'Click the button below to try it now',
  target: '[data-tour="feature"]',
  position: 'bottom',
  action: {
    label: 'Try It Now',
    onClick: () => {
      // Custom action
      router.push('/feature-page');
    },
  },
}
```

### Custom Welcome Modal Content
```tsx
<WelcomeModal
  isOpen={showWelcome}
  onClose={() => setShowWelcome(false)}
  onStartTour={handleStartTour}
  userName={user?.displayName}
/>
```

### Custom Quick Start Steps
Edit `components/onboarding/quick-start-guide.tsx`:
```typescript
const steps: QuickStartStep[] = [
  {
    id: 'custom-step',
    title: 'Custom Step',
    description: 'Do something custom',
    icon: CustomIcon,
    completed: completedSteps.has('custom-step'),
    action: {
      label: 'Do It',
      href: '/custom-page',
    },
  },
];
```

## Mobile Testing Checklist

- [ ] Welcome modal fits on small screens
- [ ] Tour tooltips don't overflow viewport
- [ ] Touch targets are 44x44px minimum
- [ ] Text is readable (12px minimum)
- [ ] Buttons are easy to tap
- [ ] Animations are smooth
- [ ] Quick start guide is collapsible
- [ ] Feature tooltips position correctly

## Analytics Integration

```typescript
// Track onboarding events
import { analytics } from '@/lib/analytics';

// Welcome modal shown
analytics.track('Onboarding Welcome Shown', {
  userId: user.id,
  timestamp: new Date(),
});

// Tour started
analytics.track('Onboarding Tour Started', {
  userId: user.id,
  tourType: 'dashboard',
});

// Step completed
analytics.track('Onboarding Step Completed', {
  userId: user.id,
  stepId: step.id,
  stepNumber: currentStep + 1,
  totalSteps: steps.length,
});

// Tour completed
analytics.track('Onboarding Tour Completed', {
  userId: user.id,
  tourType: 'dashboard',
  duration: Date.now() - startTime,
});

// Quick start step completed
analytics.track('Quick Start Step Completed', {
  userId: user.id,
  stepId: stepId,
});
```

## Troubleshooting

### Tour not highlighting element
```typescript
// Check if element exists
const element = document.querySelector('[data-tour="element"]');
console.log('Element found:', element);

// Check if element is visible
console.log('Element visible:', element?.offsetParent !== null);

// Check tour state
console.log('Tour active:', onboarding.isActive);
console.log('Current step:', onboarding.currentStep);
```

### Welcome modal not showing
```typescript
// Check new user detection
const isNew = !localStorage.getItem('pubwize_onboarding');
console.log('Is new user:', isNew);

// Check modal state
console.log('Show welcome:', showWelcome);

// Force show
setShowWelcome(true);
```

### Tooltips not appearing
```typescript
// Check if already shown
const shown = localStorage.getItem('pubwize_tooltip_id');
console.log('Tooltip shown before:', shown === 'true');

// Reset tooltip
localStorage.removeItem('pubwize_tooltip_id');

// Check delay
console.log('Tooltip delay:', delay); // Should be in ms
```
