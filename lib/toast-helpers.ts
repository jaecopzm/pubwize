/**
 * Enhanced Toast Notification Helpers
 * Provides consistent, user-friendly notifications
 */

import { toast } from "sonner";

export const toastHelpers = {
  /**
   * Success notifications
   */
  success: {
    saved: () => toast.success("Saved successfully!"),
    created: (item: string = "Item") => toast.success(`${item} created successfully!`),
    updated: (item: string = "Item") => toast.success(`${item} updated successfully!`),
    deleted: (item: string = "Item") => toast.success(`${item} deleted successfully!`),
    copied: () => toast.success("Copied to clipboard!"),
    published: () => toast.success("Published successfully!"),
    generated: (item: string = "Content") => toast.success(`${item} generated successfully!`),
  },

  /**
   * Error notifications
   */
  error: {
    generic: () => toast.error("Something went wrong. Please try again."),
    network: () => toast.error("Network error. Please check your connection."),
    auth: () => toast.error("Authentication failed. Please sign in again."),
    notFound: (item: string = "Item") => toast.error(`${item} not found.`),
    validation: (message: string) => toast.error(message),
    quota: (message: string) => toast.error(message, {
      duration: 5000,
      action: {
        label: "Upgrade",
        onClick: () => window.location.href = "/dashboard/settings?tab=billing",
      },
    }),
    rateLimit: () => toast.error("Too many requests. Please wait a moment.", {
      duration: 5000,
    }),
  },

  /**
   * Info notifications
   */
  info: {
    processing: (message: string = "Processing...") => toast.info(message),
    saving: () => toast.info("Saving..."),
    loading: (message: string = "Loading...") => toast.info(message),
  },

  /**
   * Warning notifications
   */
  warning: {
    unsavedChanges: () => toast.warning("You have unsaved changes."),
    lowQuota: (remaining: number, type: string) => 
      toast.warning(`Only ${remaining} ${type} remaining this month.`, {
        duration: 5000,
        action: {
          label: "Upgrade",
          onClick: () => window.location.href = "/dashboard/settings?tab=billing",
        },
      }),
  },

  /**
   * Promise-based notifications (for async operations)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Custom notification with action
   */
  withAction: (
    message: string,
    actionLabel: string,
    actionFn: () => void,
    type: "success" | "error" | "info" = "info"
  ) => {
    const toastFn = type === "success" ? toast.success : type === "error" ? toast.error : toast.info;
    return toastFn(message, {
      action: {
        label: actionLabel,
        onClick: actionFn,
      },
    });
  },

  /**
   * Dismissible notification
   */
  dismissible: (message: string, type: "success" | "error" | "info" = "info") => {
    const toastFn = type === "success" ? toast.success : type === "error" ? toast.error : toast.info;
    return toastFn(message, {
      duration: Infinity,
      action: {
        label: "Dismiss",
        onClick: () => {},
      },
    });
  },
};

/**
 * Handle API errors and show appropriate toast
 */
export function handleApiErrorToast(error: any) {
  if (error.upgradeRequired) {
    toastHelpers.error.quota(error.error || "Quota exceeded");
    return;
  }

  if (error.code === "RATE_LIMIT_EXCEEDED") {
    toastHelpers.error.rateLimit();
    return;
  }

  if (error.code === "AUTHENTICATION_ERROR") {
    toastHelpers.error.auth();
    return;
  }

  if (error.code === "VALIDATION_ERROR") {
    toastHelpers.error.validation(error.error || "Validation failed");
    return;
  }

  // Generic error
  toastHelpers.error.generic();
}

/**
 * Show quota warning at 80% usage
 */
export function showQuotaWarning(
  current: number,
  limit: number,
  type: string
) {
  const percentage = (current / limit) * 100;
  
  if (percentage >= 80 && percentage < 100) {
    const remaining = limit - current;
    toastHelpers.warning.lowQuota(remaining, type);
  }
}
