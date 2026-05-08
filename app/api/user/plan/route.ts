import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { withRateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email/email-service";
import { checkAccountCreationAbuse } from "@/lib/abuse-prevention";

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId: uid } = await auth();
    if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const cacheKey = cacheKeys.userPlan(uid);
    const cached = await cache.get<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    let user = await prisma.user.findUnique({ where: { id: uid } });

    // Auto-create user on first dashboard visit (webhook may not have fired yet)
    if (!user) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(uid);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      user = await prisma.user.create({
        data: {
          id: uid,
          email,
          displayName: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || null,
          photoURL: clerkUser.imageUrl || null,
          planTier: "free",
          periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      sendWelcomeEmail(email, email.split("@")[0]).catch(console.error);
    }

    const response = {
      plan: user.planTier,
      planTier: user.planTier,
      usage: {
        articlesUsed: user.articlesUsed,
        aiImprovementsUsed: user.aiImprovementsUsed,
        sectionRegenerationsUsed: user.sectionRegenerationsUsed,
        researchQueriesUsed: user.researchQueriesUsed,
        socialGenerationUsed: user.socialGenerationUsed,
        rolloverArticles: user.rolloverArticles,
        periodStart: user.periodStart,
        periodEnd: user.periodEnd,
      },
      articleCountThisPeriod: user.articlesUsed,
      periodStart: user.periodStart,
      periodEnd: user.periodEnd,
      paddleCustomerId: user.paddleCustomerId,
      paddleSubscriptionId: user.paddleSubscriptionId,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
    };

    await cache.set(cacheKey, response, cacheTTL.userPlan);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, "read");

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) return NextResponse.json({ success: true, existing: true });

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const abuseCheck = await checkAccountCreationAbuse(email, ipAddress);
    if (!abuseCheck.allowed) {
      try {
        const client = await clerkClient();
        await client.users.deleteUser(userId);
      } catch {}
      return NextResponse.json({ error: abuseCheck.reason || "Account creation not allowed" }, { status: 403 });
    }

    await prisma.user.create({
      data: {
        id: userId,
        email,
        planTier: "free",
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await cache.del(cacheKeys.userPlan(userId));

    sendWelcomeEmail(email, email.split("@")[0]).catch(console.error);

    return NextResponse.json({ success: true, existing: false });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, "write");
