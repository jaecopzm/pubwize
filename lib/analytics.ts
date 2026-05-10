type AnalyticsEventName =
  | "pricing_cta_clicked"
  | "signup_intent_started"
  | "checkout_opened"
  | "checkout_success_page_viewed"
  | "article_created"
  | "site_created";

type AnalyticsEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function cleanParams(params: AnalyticsEventParams = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
}

export function trackEvent(eventName: AnalyticsEventName, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, cleanParams(params));
}
