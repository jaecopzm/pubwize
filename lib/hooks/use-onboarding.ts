/**
 * Onboarding Hook
 * Manages user onboarding state and progress
 */

import { useState, useEffect, useCallback } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  completedSteps: string[];
  dismissed: boolean;
}

const STORAGE_KEY = 'pubwize_onboarding';

/**
 * Hook for managing onboarding flow
 */
export function useOnboarding(steps: OnboardingStep[]) {
  const [state, setState] = useState<OnboardingState>({
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    dismissed: false,
  });

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
      }
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: OnboardingState) => {
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  // Start onboarding
  const start = useCallback(() => {
    saveState({
      isActive: true,
      currentStep: 0,
      completedSteps: [],
      dismissed: false,
    });
  }, [saveState]);

  // Go to next step
  const next = useCallback(() => {
    const currentStepId = steps[state.currentStep]?.id;
    const newCompletedSteps = currentStepId
      ? [...state.completedSteps, currentStepId]
      : state.completedSteps;

    if (state.currentStep < steps.length - 1) {
      saveState({
        ...state,
        currentStep: state.currentStep + 1,
        completedSteps: newCompletedSteps,
      });
    } else {
      // Finish onboarding
      saveState({
        ...state,
        isActive: false,
        completedSteps: newCompletedSteps,
      });
    }
  }, [state, steps, saveState]);

  // Go to previous step
  const previous = useCallback(() => {
    if (state.currentStep > 0) {
      saveState({
        ...state,
        currentStep: state.currentStep - 1,
      });
    }
  }, [state, saveState]);

  // Skip to specific step
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        saveState({
          ...state,
          currentStep: stepIndex,
        });
      }
    },
    [state, steps, saveState]
  );

  // Dismiss onboarding
  const dismiss = useCallback(() => {
    saveState({
      ...state,
      isActive: false,
      dismissed: true,
    });
  }, [state, saveState]);

  // Reset onboarding
  const reset = useCallback(() => {
    saveState({
      isActive: false,
      currentStep: 0,
      completedSteps: [],
      dismissed: false,
    });
  }, [saveState]);

  // Check if step is completed
  const isStepCompleted = useCallback(
    (stepId: string) => {
      return state.completedSteps.includes(stepId);
    },
    [state.completedSteps]
  );

  // Get current step
  const currentStepData = steps[state.currentStep];

  // Calculate progress
  const progress = (state.completedSteps.length / steps.length) * 100;

  return {
    // State
    isActive: state.isActive,
    currentStep: state.currentStep,
    currentStepData,
    completedSteps: state.completedSteps,
    dismissed: state.dismissed,
    progress,
    totalSteps: steps.length,

    // Actions
    start,
    next,
    previous,
    goToStep,
    dismiss,
    reset,
    isStepCompleted,

    // Helpers
    isFirstStep: state.currentStep === 0,
    isLastStep: state.currentStep === steps.length - 1,
    canGoBack: state.currentStep > 0,
    canGoNext: state.currentStep < steps.length - 1,
  };
}

/**
 * Hook for checking if user is new (first time)
 */
export function useIsNewUser(): boolean {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    setIsNew(!saved || saved === '{}');
  }, []);

  return isNew;
}

/**
 * Hook for feature discovery tooltips
 */
export function useFeatureTooltip(featureId: string) {
  const [shown, setShown] = useState(false);
  const storageKey = `pubwize_tooltip_${featureId}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setShown(saved === 'true');
  }, [storageKey]);

  const markAsShown = useCallback(() => {
    setShown(true);
    localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  const reset = useCallback(() => {
    setShown(false);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    shown,
    markAsShown,
    reset,
    shouldShow: !shown,
  };
}
