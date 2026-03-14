import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';

import { adminDb } from '@/lib/firebase-admin';
import { cache, cacheKeys } from '@/lib/redis';
import type { SubscriptionStatus } from '@/lib/types';
import { 
  sendPaymentSuccessEmail, 
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail 
} from '@/lib/email/email-service';

const WEBHOOK_PROCESSED_PREFIX = 'dodo:webhook:processed:';
const WEBHOOK_PROCESSED_TTL = 86400; // 24 hours

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function planFromPriceId(priceId: string): string {
  const starterIds = [
    process.env.NEXT_PUBLIC_DODO_PRICE_STARTER_MONTHLY,
    process.env.NEXT_PUBLIC_DODO_PRICE_STARTER_ANNUAL,
  ];

  const proIds = [
    process.env.NEXT_PUBLIC_DODO_PRICE_PRO_MONTHLY,
    process.env.NEXT_PUBLIC_DODO_PRICE_PRO_ANNUAL,
  ];

  if (starterIds.includes(priceId)) return 'starter';
  if (proIds.includes(priceId)) return 'pro';

  return 'unknown';
}

async function updateUserSubscription(
  customerId: string,
  data: {
    dodoSubscriptionId?: string;
    plan?: string;
    status?: SubscriptionStatus;
    currentPeriodEnd?: string;
    cancelledAt?: string | null;
  },
  customDataUserId?: string
) {
  const db = adminDb();
  let userRef: FirebaseFirestore.DocumentReference | null = null;

  // 1. Try direct userId from metadata
  if (customDataUserId) {
    const directDoc = await db.collection('users').doc(customDataUserId).get();
    if (directDoc.exists) {
      userRef = directDoc.ref;
    }
  }

  // 2. Fallback to customerId lookup
  if (!userRef) {
    const snap = await db
      .collection('users')
      .where('dodoCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!snap.empty) {
      userRef = snap.docs[0].ref;
    }
  }

  if (!userRef) {
    console.error(
      `[Dodo webhook] No user found for customerId=${customerId} userId=${customDataUserId}`
    );
    return;
  }

  const updateData: any = {
    ...data,
    dodoCustomerId: customerId,
    updatedAt: new Date().toISOString(),
  };

  // SECURITY: Only update plan if status is active
  // Don't upgrade user if payment failed or subscription is on hold
  if (data.plan) {
    if (data.status === 'active') {
      updateData.planTier = data.plan;
      console.log(`[Dodo webhook] Upgrading user to plan=${data.plan}`);
    } else {
      console.log(`[Dodo webhook] NOT upgrading plan - status=${data.status} (must be active)`);
      delete updateData.plan; // Don't update plan field
    }
  }

  await userRef.update(updateData);

  const finalUserId = userRef.id;
  console.log(`[Dodo webhook] Invalidating cache for ${finalUserId}`);
  await cache.del(cacheKeys.userPlan(finalUserId));
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Dodo webhook] Missing webhook secret');
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  try {
    const rawBody = await req.text();

    const webhookId = req.headers.get('webhook-id');
    const webhookSignature = req.headers.get('webhook-signature');
    const webhookTimestamp = req.headers.get('webhook-timestamp');

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
        console.warn('[Dodo webhook] Missing required webhook headers');
        return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    // Check idempotency
    const idempotencyKey = `${WEBHOOK_PROCESSED_PREFIX}${webhookId}`;
    const alreadyProcessed = await cache.get(idempotencyKey);
    
    if (alreadyProcessed) {
      console.log(`[Dodo webhook] Already processed: ${webhookId}`);
      return NextResponse.json({ received: true });
    }

    // Verify webhook signature
    const webhook = new Webhook(webhookSecret);

    try {
        await webhook.verify(rawBody, {
            "webhook-id": webhookId,
            "webhook-signature": webhookSignature,
            "webhook-timestamp": webhookTimestamp,
        });
    } catch (err: any) {
        console.error("Webhook verification failed:", err.message);
        return NextResponse.json(
            { error: "Invalid webhook signature" },
            { status: 401 }
        );
    }

    // Parse the verified payload
    const payload = JSON.parse(rawBody);
    const { type: eventType, data } = payload;

    console.log(
        `[Dodo webhook] Event received: ${eventType}`,
        JSON.stringify({
            subscription: data.subscription_id,
            customer: data.customer?.customer_id,
        })
    );

    switch (eventType) {
      case 'subscription.active':
      case 'subscription.renewed': {
        const customerId = data.customer?.customer_id as string;
        const subscriptionId = data.subscription_id as string;

        const priceId = data.product_id ?? '';
        const plan = planFromPriceId(priceId);

        const customData = (data.metadata || data.custom_data) as Record<string, string> | undefined;
        const customDataUserId = customData?.userId;

        const currentPeriodEnd = data.next_billing_date ?? '';

        console.log(
          `[Dodo webhook] Subscription active/renewed for user=${customDataUserId} plan=${plan}`
        );

        await updateUserSubscription(
          customerId,
          {
            dodoSubscriptionId: subscriptionId,
            plan,
            status: 'active',
            currentPeriodEnd,
            cancelledAt: null,
          },
          customDataUserId
        );

        // Send payment success email
        if (eventType === 'subscription.active') {
          try {
            const db = adminDb();
            const userRef = db.collection('users').where('dodoCustomerId', '==', customerId);
            const userSnapshot = await userRef.limit(1).get();
            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0];
              const userData = userDoc.data();
              if (userData?.email) {
                const billingCycle = priceId?.includes('annual') ? 'annual' : 'monthly';
                const amount = plan === 'pro' ? (billingCycle === 'annual' ? '348' : '29') : (billingCycle === 'annual' ? '228' : '19');
                
                await sendPaymentSuccessEmail({
                  userEmail: userData.email,
                  userName: userData.displayName || 'there',
                  plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                  amount,
                  billingCycle,
                  nextBillingDate: new Date(currentPeriodEnd).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }),
                });
              }
            }
          } catch (emailError) {
            console.error('[Dodo webhook] Failed to send payment success email:', emailError);
          }
        }

        break;
      }

      case 'subscription.updated': {
        // SECURITY: Only update if subscription is already active
        // Don't upgrade on initial subscription.updated before payment succeeds
        const customerId = data.customer?.customer_id as string;
        const subscriptionId = data.subscription_id as string;
        const subscriptionStatus = data.status as string;

        // Only process if subscription is active (payment succeeded)
        if (subscriptionStatus !== 'active') {
          console.log(
            `[Dodo webhook] Ignoring subscription.updated with status=${subscriptionStatus} (waiting for active)`
          );
          break;
        }

        const priceId = data.product_id ?? '';
        const plan = planFromPriceId(priceId);

        const customData = (data.metadata || data.custom_data) as Record<string, string> | undefined;
        const customDataUserId = customData?.userId;

        const currentPeriodEnd = data.next_billing_date ?? '';

        console.log(
          `[Dodo webhook] Updating active subscription for user=${customDataUserId} plan=${plan}`
        );

        await updateUserSubscription(
          customerId,
          {
            dodoSubscriptionId: subscriptionId,
            plan,
            status: 'active',
            currentPeriodEnd,
            cancelledAt: null,
          },
          customDataUserId
        );

        break;
      }

      case 'subscription.cancelled':
      case 'subscription.expired': {
        const customerId = data.customer?.customer_id as string;

        console.log(
          `[Dodo webhook] Subscription ${eventType} for customer=${customerId}`
        );

        await updateUserSubscription(customerId, {
          status: eventType === 'subscription.cancelled' ? 'cancelled' : 'expired',
          currentPeriodEnd: data.next_billing_date ?? '',
          cancelledAt: data.cancelled_at || new Date().toISOString(),
        });

        // Send cancellation email
        if (eventType === 'subscription.cancelled') {
          try {
            const db = adminDb();
            const userRef = db.collection('users').where('dodoCustomerId', '==', customerId);
            const userSnapshot = await userRef.limit(1).get();
            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0];
              const userData = userDoc.data();
              if (userData?.email) {
                const endDate = data.next_billing_date || data.cancelled_at;
                await sendSubscriptionCancelledEmail({
                  userEmail: userData.email,
                  userName: userData.displayName || 'there',
                  plan: userData.planTier?.charAt(0).toUpperCase() + userData.planTier?.slice(1) || 'Premium',
                  endDate: new Date(endDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }),
                });
              }
            }
          } catch (emailError) {
            console.error('[Dodo webhook] Failed to send cancellation email:', emailError);
          }
        }

        break;
      }

      case 'payment.succeeded': {
        const customData = (data.metadata || data.custom_data) as Record<string, string> | undefined;
        console.log(
          `[Dodo webhook] Payment succeeded for user=${customData?.userId}`
        );
        break;
      }

      case 'payment.failed': {
        const customerId = data.customer?.customer_id as string;
        const customData = (data.metadata || data.custom_data) as Record<string, string> | undefined;

        console.log(
          `[Dodo webhook] Payment failed for customer=${customerId} user=${customData?.userId}`
        );

        // Set subscription to failed status, don't upgrade user
        await updateUserSubscription(customerId, {
          status: 'failed',
        }, customData?.userId);

        // Send payment failed email
        try {
          const db = adminDb();
          const userRef = db.collection('users').where('dodoCustomerId', '==', customerId);
          const userSnapshot = await userRef.limit(1).get();
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            if (userData?.email) {
              const plan = userData.planTier?.charAt(0).toUpperCase() + userData.planTier?.slice(1) || 'Premium';
              const amount = userData.planTier === 'pro' ? '29' : '19'; // Assume monthly
              
              await sendPaymentFailedEmail({
                userEmail: userData.email,
                userName: userData.displayName || 'there',
                plan,
                amount,
                reason: data.failure_reason || 'Payment method declined',
              });
            }
          }
        } catch (emailError) {
          console.error('[Dodo webhook] Failed to send payment failed email:', emailError);
        }

        break;
      }

      case 'subscription.payment_failed':
      case 'subscription.failed': {
        const customerId = data.customer?.customer_id as string;
        const subscriptionId = data.subscription_id as string;
        const customData = (data.metadata || data.custom_data) as Record<string, string> | undefined;

        console.log(
          `[Dodo webhook] Subscription payment failed for subscription=${subscriptionId} user=${customData?.userId}`
        );

        // Put subscription on hold, don't upgrade user
        await updateUserSubscription(customerId, {
          dodoSubscriptionId: subscriptionId,
          status: 'on_hold',
        }, customData?.userId);

        break;
      }

      case 'subscription.paused': {
        const customerId = data.customer?.customer_id as string;
        const subscriptionId = data.subscription_id as string;
        const customData = (data.metadata || data.custom_data) as Record<string, string> | undefined;

        console.log(
          `[Dodo webhook] Subscription paused for subscription=${subscriptionId}`
        );

        await updateUserSubscription(customerId, {
          dodoSubscriptionId: subscriptionId,
          status: 'paused',
        }, customData?.userId);

        break;
      }

      default:
        console.log(
          `[Dodo webhook] Unhandled event type: ${eventType}`
        );
    }

    // Mark as processed
    await cache.set(idempotencyKey, '1', WEBHOOK_PROCESSED_TTL);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Dodo webhook] Handler error:', err);
    return NextResponse.json({ received: true });
  }
}