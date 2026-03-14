/**
 * Dodo Billing integration helpers (replacement for Paddle)
 * - Client-side: initialise Dodo.js overlay checkout
 * - Server-side: price ID mapping
 */

// Note: The real Dodo SDK may differ; this module mirrors the previous Paddle API

export type DodoEnv = 'sandbox' | 'production';

export function getDodoEnv(): DodoEnv {
    return (process.env.NEXT_PUBLIC_DODO_ENV as DodoEnv) ?? 'sandbox';
}

type BillingCycle = 'monthly' | 'annual';
type PaidPlanTier = 'starter' | 'pro';

const PRICE_ID_MAP: Record<PaidPlanTier, Record<BillingCycle, string | undefined>> = {
    starter: {
        monthly: process.env.NEXT_PUBLIC_DODO_PRICE_STARTER_MONTHLY,
        annual: process.env.NEXT_PUBLIC_DODO_PRICE_STARTER_ANNUAL,
    },
    pro: {
        monthly: process.env.NEXT_PUBLIC_DODO_PRICE_PRO_MONTHLY,
        annual: process.env.NEXT_PUBLIC_DODO_PRICE_PRO_ANNUAL,
    },
};

export function getDodoPriceId(plan: PaidPlanTier, billing: BillingCycle): string {
    const id = PRICE_ID_MAP[plan]?.[billing];
    if (!id) {
        throw new Error(
            `Missing Dodo price ID for ${plan}/${billing}. ` +
            `Set NEXT_PUBLIC_DODO_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()} in .env.local`
        );
    }
    return id;
}

export function isPaymentRetryable(errorCode?: string): boolean {
    const retryableCodes = ['RATE_LIMIT', 'TIMEOUT', 'SERVICE_UNAVAILABLE', 'NETWORK_ERROR'];
    return retryableCodes.includes(errorCode || '');
}

