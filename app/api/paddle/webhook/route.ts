import { NextRequest, NextResponse } from "next/server";
import { Paddle, Environment, EventName } from "@paddle/paddle-node-sdk";
import { prisma } from "@/lib/prisma";
import { cache, cacheKeys } from "@/lib/redis";
import type { SubscriptionStatus } from "@/lib/types";
import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from "@/lib/email/email-service";

const WEBHOOK_PROCESSED_PREFIX = "paddle:webhook:processed:";
const WEBHOOK_PROCESSED_TTL = 86400;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function planFromPriceId(priceId: string): string | undefined {
  const starterIds = [
    process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY,
    process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER_ANNUAL,
  ];
  const proIds = [
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY,
    process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUAL,
  ];
  if (starterIds.includes(priceId)) return "starter";
  if (proIds.includes(priceId)) return "pro";
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
  let user = customDataUserId
    ? await prisma.user.findUnique({ where: { id: customDataUserId } })
    : null;

  if (!user) {
    user = await prisma.user.findFirst({ where: { paddleCustomerId: customerId } });
  }

  if (!user && customerId) {
    try {
      const customer = await paddleClient.customers.get(customerId);
      if (customer?.email) {
        user = await prisma.user.findUnique({ where: { email: customer.email } });
      }
    } catch {}
  }

  if (!user) {
    console.error(`[Paddle webhook] No user found for customerId=${customerId}`);
    return null;
  }

  const { plan, ...rest } = data;
  const updateData: any = {
    ...rest,
    paddleCustomerId: customerId,
    updatedAt: new Date(),
  };

  if (plan && (data.status === "active" || data.status === "trialing")) {
    updateData.planTier = plan;
  }

  await prisma.user.update({ where: { id: user.id }, data: updateData });
  await cache.del(cacheKeys.userPlan(user.id));
  return user.id;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let idempotencyKey: string | null = null;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") || "";
    if (!signature) {
      return NextResponse.json({ error: "Missing paddle-signature header" }, { status: 400 });
    }

    const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
      environment: process.env.PADDLE_ENV === "production" ? Environment.production : Environment.sandbox,
    });

    let eventData: any;
    try {
      eventData = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
    } catch {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const eventId = eventData.eventId || eventData.id;
    idempotencyKey = `${WEBHOOK_PROCESSED_PREFIX}${eventId}`;
    if (await cache.get(idempotencyKey)) {
      return NextResponse.json({ received: true });
    }

    const { eventType, data } = eventData;

    switch (eventType) {
      case EventName.SubscriptionCreated: {
        const { customerId, id: subscriptionId, status, customData } = data;
        if (status === "active" || status === "trialing") {
          const priceId = data.items?.[0]?.price?.id ?? "";
          const plan = planFromPriceId(priceId);
          const currentPeriodEnd = data.nextBilledAt ?? data.currentBillingPeriod?.endsAt ?? "";
          const resolvedUserId = await updateUserSubscription(
            paddle, customerId,
            { paddleSubscriptionId: subscriptionId, plan, status, currentPeriodEnd, cancelledAt: null },
            customData?.userId
          );
          if (resolvedUserId && plan) {
            const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
            if (user?.email) {
              const billingCycle = priceId.includes("annual") ? "annual" : "monthly";
              const amount = plan === "pro" ? (billingCycle === "annual" ? "348" : "29") : (billingCycle === "annual" ? "228" : "19");
              await sendPaymentSuccessEmail({ userEmail: user.email, userName: user.displayName || "there", plan: plan.charAt(0).toUpperCase() + plan.slice(1), amount, billingCycle, nextBillingDate: new Date(currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }).catch(console.error);
            }
          }
        } else {
          await updateUserSubscription(paddle, customerId, { paddleSubscriptionId: subscriptionId, status }, customData?.userId);
        }
        break;
      }

      case EventName.SubscriptionActivated:
      case EventName.SubscriptionUpdated: {
        const { customerId, id: subscriptionId, status, customData } = data;
        if (status !== "active" && status !== "trialing") break;
        const priceId = data.items?.[0]?.price?.id ?? "";
        const plan = planFromPriceId(priceId);
        const currentPeriodEnd = data.nextBilledAt ?? data.currentBillingPeriod?.endsAt ?? "";
        const resolvedUserId = await updateUserSubscription(
          paddle, customerId,
          { paddleSubscriptionId: subscriptionId, plan, status, currentPeriodEnd, cancelledAt: null },
          customData?.userId
        );
        if (resolvedUserId && plan) {
          const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
          if (user?.email) {
            const billingCycle = priceId.includes("annual") ? "annual" : "monthly";
            const amount = plan === "pro" ? (billingCycle === "annual" ? "348" : "29") : (billingCycle === "annual" ? "228" : "19");
            await sendPaymentSuccessEmail({ userEmail: user.email, userName: user.displayName || "there", plan: plan.charAt(0).toUpperCase() + plan.slice(1), amount, billingCycle, nextBillingDate: new Date(currentPeriodEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }).catch(console.error);
          }
        }
        break;
      }

      case EventName.SubscriptionCanceled: {
        const resolvedUserId = await updateUserSubscription(paddle, data.customerId, {
          status: "cancelled",
          currentPeriodEnd: data.currentBillingPeriod?.endsAt ?? "",
          cancelledAt: data.canceledAt || new Date().toISOString(),
        });
        if (resolvedUserId) {
          const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
          if (user?.email) {
            const endDate = data.currentBillingPeriod?.endsAt || data.canceledAt;
            await sendSubscriptionCancelledEmail({ userEmail: user.email, userName: user.displayName || "there", plan: user.planTier?.charAt(0).toUpperCase() + user.planTier?.slice(1) || "Premium", endDate: new Date(endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }).catch(console.error);
          }
        }
        break;
      }

      case EventName.SubscriptionPastDue:
        await updateUserSubscription(paddle, data.customerId, { paddleSubscriptionId: data.id, status: "on_hold" });
        break;

      case EventName.SubscriptionPaused:
        await updateUserSubscription(paddle, data.customerId, { paddleSubscriptionId: data.id, status: "paused" });
        break;

      case EventName.TransactionCompleted: {
        if (!data.subscriptionId) break;
        const priceId = data.items?.[0]?.price?.id ?? "";
        const plan = planFromPriceId(priceId);
        const resolvedUserId = await updateUserSubscription(
          paddle, data.customerId,
          { paddleSubscriptionId: data.subscriptionId, plan, status: "active", cancelledAt: null },
          data.customData?.userId
        );
        if (resolvedUserId && plan) {
          const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
          if (user?.email) {
            const billingCycle = priceId.includes("annual") ? "annual" : "monthly";
            await sendPaymentSuccessEmail({ userEmail: user.email, userName: user.displayName || "there", plan: plan.charAt(0).toUpperCase() + plan.slice(1), amount: plan === "pro" ? "29" : "19", billingCycle, nextBillingDate: "" }).catch(console.error);
          }
        }
        break;
      }

      case EventName.TransactionPaymentFailed: {
        const resolvedUserId = await updateUserSubscription(paddle, data.customerId, { status: "failed" }, data.customData?.userId);
        if (resolvedUserId) {
          const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
          if (user?.email) {
            await sendPaymentFailedEmail({ userEmail: user.email, userName: user.displayName || "there", plan: user.planTier?.charAt(0).toUpperCase() + user.planTier?.slice(1) || "Premium", amount: user.planTier === "pro" ? "29" : "19", reason: data.payments?.[0]?.errorCode || "Payment method declined" }).catch(console.error);
          }
        }
        break;
      }
    }

    await cache.set(idempotencyKey, "1", WEBHOOK_PROCESSED_TTL);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paddle webhook] Handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
