import { NextRequest, NextResponse } from 'next/server';
import { Paddle, Environment, EventName } from '@paddle/paddle-node-sdk';
import { adminDb } from '@/lib/firebase-admin';
import { cache, cacheKeys } from '@/lib/redis';
import type { SubscriptionStatus } from '@/lib/types';
import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email/email-service';

const WEBHOOK_PROCESSED_PREFIX = 'paddle:webhook:processed:';
const WEBHOOK_PROCESSED_TTL = 86400;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function planFromPriceId(priceId: string): string | undefined {
  const starterIds = [
    process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY,
    process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_ANNUAL,
  ];
  const proIds = [
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY,
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUAL,
  ];
  if (starterIds.includes(priceId)) return 'starter';
  if (proIds.includes(priceId)) return 'pro';
  
  console.warn(`[Paddle webhook] Unknown price ID encountered: ${priceId}`);
  return undefined;
}

async function updateUserSubscription(
  paddleClient: Paddle,
  customerId: string,
  data: {
    paddleSubscriptionId?: string;
    plan?: string;
    status?: SubscriptionStatus;
    currentPeriodEnd?: string;
    cancelledAt?: string | null;
  },
  customDataUserId?: string
): Promise<string | null> {
  const db = adminDb();
  let userRef: FirebaseFirestore.DocumentReference | null = null;

  if (customDataUserId) {
    const directDoc = await db.collection('users').doc(customDataUserId).get();
    if (directDoc.exists) userRef = directDoc.ref;
  }

  if (!userRef) {
    const snap = await db.collection('users').where('paddleCustomerId', '==', customerId).limit(1).get();
    if (!snap.empty) userRef = snap.docs[0].ref;
  }

  // Fallback to email lookup by interrogating Paddle API
  if (!userRef && customerId) {
    try {
      console.log(`[Paddle webhook] Customer ID ${customerId} not found directly, falling back to email lookup...`);
      const customer = await paddleClient.customers.get(customerId);
      if (customer && customer.email) {
        const snap = await db.collection('users').where('email', '==', customer.email).limit(1).get();
        if (!snap.empty) {
          userRef = snap.docs[0].ref;
          console.log(`[Paddle webhook] Successfully mapped customerId=${customerId} to user by email=${customer.email}`);
        } else {
          console.error(`[Paddle webhook] Email ${customer.email} not found in database.`);
        }
      }
    } catch (err) {
      console.error(`[Paddle webhook] Failed to retrieve customer email from Paddle API:`, err);
    }
  }

  if (!userRef) {
    console.error(`[Paddle webhook] No user found for customerId=${customerId} userId=${customDataUserId}`);
    return null;
  }

  const { plan, ...rest } = data;
  const updateData: Record<string, unknown> = {
    ...rest,
    paddleCustomerId: customerId,
    updatedAt: new Date().toISOString(),
  };

  if (plan && (data.status === 'active' || data.status === 'trialing')) {
    updateData.planTier = plan;
  }

  await userRef.update(updateData);
  const resolvedUserId = userRef.id;
  await cache.del(cacheKeys.userPlan(resolvedUserId));
  return resolvedUserId;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Paddle webhook] Missing PADDLE_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  let idempotencyKey: string | null = null;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('paddle-signature') || '';

    if (!signature) {
      return NextResponse.json({ error: 'Missing paddle-signature header' }, { status: 400 });
    }

    const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
      environment: process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox,
    });

    let eventData: any;
    try {
      console.log('[Paddle webhook] Verifying signature...', {
        secretPrefix: webhookSecret.substring(0, 10),
        signaturePrefix: signature.substring(0, 20),
        bodyLength: rawBody.length,
      });
      eventData = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
    } catch (err) {
      console.error('[Paddle webhook] Signature verification failed:', err);
      console.log('[Paddle webhook] Raw body preview:', rawBody.substring(0, 200));
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const eventId = eventData.eventId || eventData.id;
    idempotencyKey = `${WEBHOOK_PROCESSED_PREFIX}${eventId}`;
    const alreadyProcessed = await cache.get(idempotencyKey);
    if (alreadyProcessed) {
      console.log(`[Paddle webhook] Already processed: ${eventId}`);
      return NextResponse.json({ received: true });
    }

    const { eventType, data } = eventData;
    console.log(`[Paddle webhook] Event: ${eventType}`);

    switch (eventType) {
      case EventName.SubscriptionCreated: {
        // Subscription created - check if already paid
        const customerId: string = data.customerId;
        const subscriptionId: string = data.id;
        const status: string = data.status;
        const customDataUserId: string | undefined = data.customData?.userId;

        console.log(`[Paddle webhook] Subscription created: ${subscriptionId}, status=${status}`);

        // If subscription is already active or trialing, upgrade immediately
        if (status === 'active' || status === 'trialing') {
          const priceId: string = data.items?.[0]?.price?.id ?? '';
          const plan = planFromPriceId(priceId);
          const currentPeriodEnd: string = data.nextBilledAt ?? data.currentBillingPeriod?.endsAt ?? '';

          console.log(`[Paddle webhook] Subscription already active, upgrading to plan=${plan}`);

          const resolvedUserId = await updateUserSubscription(
            paddle,
            customerId,
            { 
              paddleSubscriptionId: subscriptionId, 
              plan, 
              status: status as any, 
              currentPeriodEnd, 
              cancelledAt: null 
            },
            customDataUserId
          );

          if (resolvedUserId && plan) {
            try {
              const userDoc = await adminDb().collection('users').doc(resolvedUserId).get();
              const userData = userDoc.data();
              if (userData?.email) {
                const billingCycle = priceId.includes('annual') ? 'annual' : 'monthly';
                const amount = plan === 'pro' ? (billingCycle === 'annual' ? '348' : '29') : (billingCycle === 'annual' ? '228' : '19');
                await sendPaymentSuccessEmail({
                  userEmail: userData.email,
                  userName: userData.displayName || 'there',
                  plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                  amount,
                  billingCycle,
                  nextBillingDate: new Date(currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                });
              }
            } catch (emailError) {
              console.error('[Paddle webhook] Failed to send payment success email:', emailError);
            }
          }
        } else {
          // Store subscription ID but don't upgrade yet
          await updateUserSubscription(
            paddle,
            customerId,
            { 
              paddleSubscriptionId: subscriptionId, 
              status: status as any,
            },
            customDataUserId
          );
        }
        break;
      }

      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated: {
        const customerId: string = data.customerId;
        const subscriptionId: string = data.id;
        const status: string = data.status;

        // Only upgrade user when subscription is active or trialing
        if (status !== 'active' && status !== 'trialing') {
          console.log(`[Paddle webhook] Ignoring ${eventType} with status=${status}`);
          break;
        }

        const priceId: string = data.items?.[0]?.price?.id ?? '';
        const plan = planFromPriceId(priceId);
        const customDataUserId: string | undefined = data.customData?.userId;
        const currentPeriodEnd: string = data.nextBilledAt ?? data.currentBillingPeriod?.endsAt ?? '';

        console.log(`[Paddle webhook] Upgrading user to plan=${plan}`);

        const resolvedUserId = await updateUserSubscription(
          paddle,
          customerId,
          { 
            paddleSubscriptionId: subscriptionId, 
            plan, 
            status: status as any, 
            currentPeriodEnd, 
            cancelledAt: null 
          },
          customDataUserId
        );

        if (resolvedUserId && plan) {
          try {
            const userDoc = await adminDb().collection('users').doc(resolvedUserId).get();
            const userData = userDoc.data();
            if (userData?.email) {
              const billingCycle = priceId.includes('annual') ? 'annual' : 'monthly';
              const amount = plan === 'pro' ? (billingCycle === 'annual' ? '348' : '29') : (billingCycle === 'annual' ? '228' : '19');
              await sendPaymentSuccessEmail({
                userEmail: userData.email,
                userName: userData.displayName || 'there',
                plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                amount,
                billingCycle,
                nextBillingDate: new Date(currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              });
            }
          } catch (emailError) {
            console.error('[Paddle webhook] Failed to send payment success email:', emailError);
          }
        }
        break;
      }

      case EventName.SubscriptionCanceled: {
        const customerId: string = data.customerId;
        const resolvedUserId = await updateUserSubscription(paddle, customerId, {
          status: 'cancelled',
          currentPeriodEnd: data.currentBillingPeriod?.endsAt ?? '',
          cancelledAt: data.canceledAt || new Date().toISOString(),
        });

        if (resolvedUserId) {
          try {
            const userDoc = await adminDb().collection('users').doc(resolvedUserId).get();
            const userData = userDoc.data();
            if (userData?.email) {
              const endDate = data.currentBillingPeriod?.endsAt || data.canceledAt;
              await sendSubscriptionCancelledEmail({
                userEmail: userData.email,
                userName: userData.displayName || 'there',
                plan: userData.planTier?.charAt(0).toUpperCase() + userData.planTier?.slice(1) || 'Premium',
                endDate: new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              });
            }
          } catch (emailError) {
            console.error('[Paddle webhook] Failed to send cancellation email:', emailError);
          }
        }
        break;
      }

      case EventName.SubscriptionPastDue: {
        const customerId: string = data.customerId;
        await updateUserSubscription(paddle, customerId, { paddleSubscriptionId: data.id, status: 'on_hold' });
        break;
      }

      case EventName.SubscriptionPaused: {
        const customerId: string = data.customerId;
        await updateUserSubscription(paddle, customerId, { paddleSubscriptionId: data.id, status: 'paused' });
        break;
      }

      case EventName.TransactionCompleted: {
        // Payment succeeded for a subscription transaction
        const customerId: string = data.customerId;
        const subscriptionId: string = data.subscriptionId;
        const customDataUserId: string | undefined = data.customData?.userId;
        if (!subscriptionId) break;

        const priceId: string = data.items?.[0]?.price?.id ?? '';
        const plan = planFromPriceId(priceId);

        const resolvedUserId = await updateUserSubscription(
          paddle,
          customerId,
          { paddleSubscriptionId: subscriptionId, plan, status: 'active', cancelledAt: null },
          customDataUserId
        );

        if (resolvedUserId && plan) {
          try {
            const userDoc = await adminDb().collection('users').doc(resolvedUserId).get();
            const userData = userDoc.data();
            if (userData?.email) {
              const billingCycle = priceId.includes('annual') ? 'annual' : 'monthly';
              const amount = plan === 'pro' ? '29' : '19';
              await sendPaymentSuccessEmail({
                userEmail: userData.email,
                userName: userData.displayName || 'there',
                plan: plan.charAt(0).toUpperCase() + plan.slice(1),
                amount,
                billingCycle,
                nextBillingDate: '',
              });
            }
          } catch (emailError) {
            console.error('[Paddle webhook] Failed to send payment success email:', emailError);
          }
        }
        break;
      }

      case EventName.TransactionPaymentFailed: {
        const customerId: string = data.customerId;
        const customDataUserId: string | undefined = data.customData?.userId;

        const resolvedUserId = await updateUserSubscription(paddle, customerId, { status: 'failed' }, customDataUserId);

        if (resolvedUserId) {
          try {
            const userDoc = await adminDb().collection('users').doc(resolvedUserId).get();
            const userData = userDoc.data();
            if (userData?.email) {
              const plan = userData.planTier?.charAt(0).toUpperCase() + userData.planTier?.slice(1) || 'Premium';
              const amount = userData.planTier === 'pro' ? '29' : '19';
              await sendPaymentFailedEmail({
                userEmail: userData.email,
                userName: userData.displayName || 'there',
                plan,
                amount,
                reason: data.payments?.[0]?.errorCode || 'Payment method declined',
              });
            }
          } catch (emailError) {
            console.error('[Paddle webhook] Failed to send payment failed email:', emailError);
          }
        }
        break;
      }

      default:
        console.log(`[Paddle webhook] Unhandled event type: ${eventType}`);
    }

    await cache.set(idempotencyKey, '1', WEBHOOK_PROCESSED_TTL);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Paddle webhook] Handler error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
