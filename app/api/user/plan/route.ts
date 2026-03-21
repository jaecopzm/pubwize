import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cache, cacheKeys, cacheTTL } from "@/lib/redis";
import { withRateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email/email-service";
import { checkAccountCreationAbuse } from "@/lib/abuse-prevention";

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const [, token] = authHeader.split(" ");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    // Try to get from cache first
    const cacheKey = cacheKeys.userPlan(uid);
    const cached = await cache.get<any>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }

    const db = adminDb();
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data();

    // Support both old and new field names for backward compatibility
    const plan = userData?.planTier || userData?.plan || "free";
    const usage = userData?.usage || {
      articlesUsed: userData?.articleCountThisPeriod || 0,
      aiImprovementsUsed: userData?.optimizationCountThisPeriod || 0,
      sectionRegenerationsUsed: 0,
      researchQueriesUsed: 0,
      rolloverArticles: 0,
    };

    const response = {
      plan,
      planTier: plan, // Keep for backward compatibility
      usage,
      articleCountThisPeriod: usage.articlesUsed, // Keep for backward compatibility
      optimizationCountThisPeriod: usage.aiImprovementsUsed, // Keep for backward compatibility
      periodStart: usage.periodStart || userData?.periodStart,
      periodEnd: usage.periodEnd || userData?.periodEnd,
      paddleCustomerId: userData?.paddleCustomerId,
      paddleSubscriptionId: userData?.paddleSubscriptionId,
      status: userData?.status,
      currentPeriodEnd: userData?.currentPeriodEnd,
    };

    // Cache the response
    await cache.set(cacheKey, response, cacheTTL.userPlan);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}, 'read');

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    const db = adminDb();

    // Check if user already exists
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // If user is marked as deleted, allow re-creation
      if (userData?.deleted) {
        // Continue to create new user (will overwrite the deleted marker)
      } else {
        // User already exists and is active, don't overwrite
        return NextResponse.json({ success: true, existing: true });
      }
    }

    // Get IP address for abuse prevention
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Check for abuse patterns
    const abuseCheck = await checkAccountCreationAbuse(email, ipAddress);
    
    if (!abuseCheck.allowed) {
      // Delete the Firebase Auth user that was just created
      try {
        await adminAuth().deleteUser(userId);
      } catch (err) {
        console.error('Failed to delete abusive user:', err);
      }
      
      return NextResponse.json(
        { error: abuseCheck.reason || "Account creation not allowed" }, 
        { status: 403 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Create new user with free tier and new usage structure
    await userRef.set({
      email,
      emailDomain: email.split('@')[1]?.toLowerCase(),
      signupIp: ipAddress,
      plan: "free", // Use 'plan' instead of 'planTier' for consistency
      usage: {
        articlesUsed: 0,
        aiImprovementsUsed: 0,
        sectionRegenerationsUsed: 0,
        researchQueriesUsed: 0,
        rolloverArticles: 0,
        periodStart: now,
        periodEnd,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Invalidate cache for this user
    await cache.del(cacheKeys.userPlan(userId));

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, email.split('@')[0])
      .then(() => console.log(`[User Plan] Welcome email sent to ${email}`))
      .catch(err => {
        console.error('[User Plan] Failed to send welcome email:', err);
        // Check if it's a Resend API key issue
        if (!process.env.RESEND_API_KEY) {
          console.error('[User Plan] RESEND_API_KEY is not configured!');
        }
      });

    return NextResponse.json({ success: true, existing: false });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}, 'write');
