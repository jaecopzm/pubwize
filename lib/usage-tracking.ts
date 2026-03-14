/**
 * Usage tracking utilities for pricing enforcement
 * Works with Firebase Admin SDK
 */

import { FieldValue } from 'firebase-admin/firestore';
import { PLANS, hasReachedLimit, type PlanTier } from './pricing';

export type UsageType = 'articles' | 'aiImprovements' | 'sectionRegenerations' | 'researchQueries' | 'socialGeneration';

export interface UserUsage {
  articlesUsed: number;
  aiImprovementsUsed: number;
  sectionRegenerationsUsed: number;
  researchQueriesUsed: number;
  socialGenerationUsed: number;
  rolloverArticles: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Increment usage counter in Firestore (Admin SDK)
 */
export async function incrementUsage(
  db: FirebaseFirestore.Firestore,
  userId: string,
  type: UsageType
): Promise<void> {
  const userRef = db.collection('users').doc(userId);

  const field = type === 'articles' 
    ? 'usage.articlesUsed'
    : type === 'aiImprovements'
    ? 'usage.aiImprovementsUsed'
    : type === 'researchQueries'
    ? 'usage.researchQueriesUsed'
    : type === 'socialGeneration'
    ? 'usage.socialGenerationUsed'
    : 'usage.sectionRegenerationsUsed';

  await userRef.update({
    [field]: FieldValue.increment(1),
    updatedAt: new Date(),
  });
}

/**
 * Check if user can perform an action based on their plan limits (Admin SDK)
 */
export async function canPerformAction(
  db: FirebaseFirestore.Firestore,
  userId: string,
  type: UsageType
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return {
        allowed: false,
        reason: 'User not found',
      };
    }

    const userData = userSnap.data();
    if (!userData) {
      return {
        allowed: false,
        reason: 'User data not found',
      };
    }

    const plan: PlanTier = userData.plan || 'free';
    const limits = PLANS[plan].limits;
    const usage = userData.usage || {
      articlesUsed: 0,
      aiImprovementsUsed: 0,
      sectionRegenerationsUsed: 0,
      researchQueriesUsed: 0,
      rolloverArticles: 0,
    };

    let current: number;
    let limit: number;
    let rollover = 0;

    switch (type) {
      case 'articles':
        current = usage.articlesUsed || 0;
        limit = limits.articlesPerMonth;
        rollover = usage.rolloverArticles || 0;
        break;
      case 'aiImprovements':
        current = usage.aiImprovementsUsed || 0;
        limit = limits.aiImprovementsPerMonth;
        break;
      case 'sectionRegenerations':
        current = usage.sectionRegenerationsUsed || 0;
        limit = limits.sectionRegenerationsPerMonth;
        break;
      case 'researchQueries':
        current = usage.researchQueriesUsed || 0;
        limit = limits.researchQueriesPerMonth;
        break;
      case 'socialGeneration':
        current = usage.socialGenerationUsed || 0;
        limit = limits.socialGenerationsPerMonth;
        break;
    }

    if (hasReachedLimit(current, limit, rollover)) {
      const typeName = type === 'articles' 
        ? 'articles' 
        : type === 'aiImprovements'
        ? 'AI improvements'
        : type === 'researchQueries'
        ? 'keyword research queries'
        : type === 'socialGeneration'
        ? 'social media generations'
        : 'section regenerations';

      const nextTier = plan === 'free' ? 'Starter' : 'Pro';
      const nextLimit = plan === 'free' 
        ? (type === 'articles' ? 25 : type === 'aiImprovements' ? 75 : 50)
        : (type === 'articles' ? 60 : 'unlimited');

      return {
        allowed: false,
        reason: `You've used ${current}/${limit + rollover} ${typeName} this month. Upgrade to ${nextTier} for ${nextLimit === 'unlimited' ? 'unlimited' : nextLimit} ${typeName}!`,
        current,
        limit: limit + rollover,
      };
    }

    return { 
      allowed: true,
      current,
      limit: limit + rollover,
    };
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return {
      allowed: false,
      reason: 'Failed to check usage limits',
    };
  }
}

/**
 * Get user's current usage stats (Admin SDK)
 */
export async function getUserUsage(
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<UserUsage | null> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return null;
    }

    const userData = userSnap.data();
    if (!userData) {
      return null;
    }

    const usage = userData.usage || {};

    return {
      articlesUsed: usage.articlesUsed || 0,
      aiImprovementsUsed: usage.aiImprovementsUsed || 0,
      sectionRegenerationsUsed: usage.sectionRegenerationsUsed || 0,
      researchQueriesUsed: usage.researchQueriesUsed || 0,
      socialGenerationUsed: usage.socialGenerationUsed || 0,
      rolloverArticles: usage.rolloverArticles || 0,
      periodStart: usage.periodStart?.toDate() || new Date(),
      periodEnd: usage.periodEnd?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error fetching user usage:', error);
    return null;
  }
}

/**
 * Reset monthly usage (called by cron job) (Admin SDK)
 */
export async function resetMonthlyUsage(
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<void> {
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return;
  }

  const userData = userSnap.data();
  if (!userData) {
    return;
  }

  const plan: PlanTier = userData.plan || 'free';
  const limits = PLANS[plan].limits;
  const usage = userData.usage || {};

  // Calculate rollover
  const unusedArticles = Math.max(0, limits.articlesPerMonth - (usage.articlesUsed || 0));
  const rollover = Math.min(unusedArticles, limits.rolloverLimit);

  // Reset usage
  await userRef.update({
    'usage.articlesUsed': 0,
    'usage.aiImprovementsUsed': 0,
    'usage.sectionRegenerationsUsed': 0,
    'usage.researchQueriesUsed': 0,
    'usage.rolloverArticles': rollover,
    'usage.periodStart': new Date(),
    'usage.periodEnd': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    updatedAt: new Date(),
  });
}
