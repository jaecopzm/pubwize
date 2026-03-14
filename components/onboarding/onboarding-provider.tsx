/**
 * Onboarding Provider
 * Wraps the dashboard with onboarding functionality
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { OnboardingTour } from './onboarding-tour';
import { WelcomeModal } from './welcome-modal';
import { useOnboarding, useIsNewUser } from '@/lib/hooks/use-onboarding';
import { dashboardTourSteps, articleEditorTourSteps, researchTourSteps } from '@/lib/onboarding/dashboard-tour';

interface OnboardingProviderProps {
  children: React.ReactNode;
  userName?: string;
}

export function OnboardingProvider({ children, userName }: OnboardingProviderProps) {
  const pathname = usePathname();
  const isNewUser = useIsNewUser();
  const [showWelcome, setShowWelcome] = useState(false);

  // Determine which tour to show based on current page
  const getTourSteps = () => {
    if (pathname?.includes('/articles/') && !pathname?.includes('/articles/new')) {
      return articleEditorTourSteps;
    }
    if (pathname?.includes('/research')) {
      return researchTourSteps;
    }
    return dashboardTourSteps;
  };

  const onboarding = useOnboarding(getTourSteps());

  // Show welcome modal for new users
  useEffect(() => {
    if (isNewUser && pathname === '/dashboard') {
      // Small delay to let the page load
      setTimeout(() => {
        setShowWelcome(true);
      }, 500);
    }
  }, [isNewUser, pathname]);

  return (
    <>
      {children}

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        onStartTour={() => {
          setShowWelcome(false);
          onboarding.start();
        }}
        userName={userName}
      />

      {/* Interactive Tour */}
      <OnboardingTour
        isActive={onboarding.isActive}
        currentStep={onboarding.currentStep}
        steps={getTourSteps()}
        onNext={onboarding.next}
        onPrevious={onboarding.previous}
        onDismiss={onboarding.dismiss}
        isFirstStep={onboarding.isFirstStep}
        isLastStep={onboarding.isLastStep}
        progress={onboarding.progress}
      />
    </>
  );
}
