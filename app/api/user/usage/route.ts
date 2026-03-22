import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PLANS, type PlanTier } from '@/lib/pricing';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = adminDb();

    // Get user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const plan: PlanTier = (userData?.planTier as PlanTier) || (userData?.plan as PlanTier) || 'free';
    const limits = PLANS[plan].limits;
    const usage = userData?.usage || {
      articlesUsed: 0,
      aiImprovementsUsed: 0,
      sectionRegenerationsUsed: 0,
      rolloverArticles: 0,
    };

    return NextResponse.json({
      plan,
      limits,
      usage: {
        articlesUsed: usage.articlesUsed || 0,
        aiImprovementsUsed: usage.aiImprovementsUsed || 0,
        sectionRegenerationsUsed: usage.sectionRegenerationsUsed || 0,
        rolloverArticles: usage.rolloverArticles || 0,
      },
      periodStart: usage.periodStart?.toDate?.() || new Date(),
      periodEnd: usage.periodEnd?.toDate?.() || new Date(),
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
