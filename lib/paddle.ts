import { Paddle, Environment } from '@paddle/paddle-node-sdk';

export function getPaddleClient(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error('Missing PADDLE_API_KEY');
  const env = process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox;
  return new Paddle(apiKey, { environment: env });
}

type BillingCycle = 'monthly' | 'annual';
type PaidPlanTier = 'starter' | 'pro';

const PRICE_ID_MAP: Record<PaidPlanTier, Record<BillingCycle, string | undefined>> = {
  starter: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY,
    annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_ANNUAL,
  },
  pro: {
    monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY,
    annual: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUAL,
  },
};

export function getPaddlePriceId(plan: PaidPlanTier, billing: BillingCycle): string {
  const id = PRICE_ID_MAP[plan]?.[billing];
  if (!id) {
    throw new Error(
      `Missing Paddle price ID for ${plan}/${billing}. ` +
      `Set NEXT_PUBLIC_PADDLE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()} in .env.local`
    );
  }
  return id;
}
