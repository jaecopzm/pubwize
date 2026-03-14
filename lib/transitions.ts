/**
 * Smooth Transition Utilities
 * Consistent animations and transitions across the app
 */

/**
 * Standard transition durations (in ms)
 */
export const TRANSITION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * Standard easing functions
 */
export const EASING = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Fade transition classes
 */
export const fadeTransition = {
  enter: 'transition-opacity duration-300 ease-out',
  enterFrom: 'opacity-0',
  enterTo: 'opacity-100',
  leave: 'transition-opacity duration-200 ease-in',
  leaveFrom: 'opacity-100',
  leaveTo: 'opacity-0',
};

/**
 * Scale transition classes
 */
export const scaleTransition = {
  enter: 'transition-all duration-300 ease-out',
  enterFrom: 'opacity-0 scale-95',
  enterTo: 'opacity-100 scale-100',
  leave: 'transition-all duration-200 ease-in',
  leaveFrom: 'opacity-100 scale-100',
  leaveTo: 'opacity-0 scale-95',
};

/**
 * Slide transition classes
 */
export const slideTransition = {
  up: {
    enter: 'transition-all duration-300 ease-out',
    enterFrom: 'opacity-0 translate-y-4',
    enterTo: 'opacity-100 translate-y-0',
    leave: 'transition-all duration-200 ease-in',
    leaveFrom: 'opacity-100 translate-y-0',
    leaveTo: 'opacity-0 translate-y-4',
  },
  down: {
    enter: 'transition-all duration-300 ease-out',
    enterFrom: 'opacity-0 -translate-y-4',
    enterTo: 'opacity-100 translate-y-0',
    leave: 'transition-all duration-200 ease-in',
    leaveFrom: 'opacity-100 translate-y-0',
    leaveTo: 'opacity-0 -translate-y-4',
  },
  left: {
    enter: 'transition-all duration-300 ease-out',
    enterFrom: 'opacity-0 translate-x-4',
    enterTo: 'opacity-100 translate-x-0',
    leave: 'transition-all duration-200 ease-in',
    leaveFrom: 'opacity-100 translate-x-0',
    leaveTo: 'opacity-0 translate-x-4',
  },
  right: {
    enter: 'transition-all duration-300 ease-out',
    enterFrom: 'opacity-0 -translate-x-4',
    enterTo: 'opacity-100 translate-x-0',
    leave: 'transition-all duration-200 ease-in',
    leaveFrom: 'opacity-100 translate-x-0',
    leaveTo: 'opacity-0 -translate-x-4',
  },
};

/**
 * Stagger animation for lists
 */
export function getStaggerDelay(index: number, baseDelay = 50): string {
  return `${index * baseDelay}ms`;
}

/**
 * Page transition wrapper
 */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

/**
 * Modal transition
 */
export const modalTransition = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  content: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

/**
 * Skeleton loading animation
 */
export const skeletonAnimation = 'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted';

/**
 * Success animation (scale bounce)
 */
export const successAnimation = 'animate-[scale-bounce_0.3s_ease-in-out]';

/**
 * Error shake animation
 */
export const errorAnimation = 'animate-[shake_0.3s_ease-in-out]';

/**
 * Add custom animations to globals.css
 */
export const customAnimations = `
@keyframes scale-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
`;
