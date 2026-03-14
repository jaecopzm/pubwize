import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { withRateLimit } from '@/lib/rate-limit';
import { PLANS } from '@/lib/pricing';
import type { PlanTier } from '@/lib/types';

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get('authorization');
    const [, token] = authHeader?.split(' ') || [];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);
    const uid = decoded.uid;

    const db = adminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const planTier = userData.planTier || 'free';
    const plan: PlanTier = planTier === 'free' || planTier === 'starter' || planTier === 'pro' ? planTier : 'free';
    const limits = PLANS[plan].limits;
    const usage = userData.usage || {};

    // Calculate current period usage (excluding rollover for display)
    const currentPeriodUsage = {
      articlesUsed: Math.min(usage.articlesUsed || 0, limits.articlesPerMonth),
      aiImprovementsUsed: usage.aiImprovementsUsed || 0,
      sectionRegenerationsUsed: usage.sectionRegenerationsUsed || 0,
      researchQueriesUsed: usage.researchQueriesUsed || 0,
      socialGenerationUsed: usage.socialGenerationUsed || 0,
    };

    // Get articles stats
    const articlesSnapshot = await db
      .collection('articles')
      .where('ownerId', '==', uid)
      .get();

    const articles = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    const statusBreakdown = {
      brief: articles.filter(a => a.status === 'brief').length,
      outline: articles.filter(a => a.status === 'outline').length,
      draft: articles.filter(a => a.status === 'draft').length,
      optimized: articles.filter(a => a.status === 'optimized').length,
    };

    // Performance Metrics
    const completedArticles = articles.filter(a => a.status === 'optimized' && a.createdAt && a.updatedAt);
    const avgCompletionTime = completedArticles.length > 0
      ? completedArticles.reduce((sum, a) => {
          const start = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const end = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
          return sum + (end.getTime() - start.getTime());
        }, 0) / completedArticles.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const completionTimes = completedArticles.map(a => {
      const start = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const end = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // Hours
    }).sort((a, b) => a - b);

    // Content Insights
    const keywordCounts = articles.reduce((acc: any, a) => {
      acc[a.keyword] = (acc[a.keyword] || 0) + 1;
      return acc;
    }, {});
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));

    const siteCounts = articles.reduce((acc: any, a) => {
      acc[a.siteId] = (acc[a.siteId] || 0) + 1;
      return acc;
    }, {});
    const mostUsedSite = Object.entries(siteCounts).sort(([, a]: any, [, b]: any) => b - a)[0];

    const avgWordCount = articles.length > 0
      ? Math.round(articles.reduce((sum, a) => sum + (a.wordCount || 0), 0) / articles.length)
      : 0;

    // ROI Calculator
    const planPrice = plan === 'pro' ? 49 : plan === 'starter' ? 19 : 0;
    const costPerArticle = currentPeriodUsage.articlesUsed > 0 ? planPrice / currentPeriodUsage.articlesUsed : 0;
    const timeSavedHours = currentPeriodUsage.articlesUsed * 3.5; // Assume 3.5 hours saved per article
    const valueGenerated = currentPeriodUsage.articlesUsed * 150; // Assume $150 value per article

    // Get sites count
    const sitesSnapshot = await db
      .collection('sites')
      .where('ownerId', '==', uid)
      .get();

    // Calculate usage percentages
    const usagePercentages = {
      articles: Math.round((currentPeriodUsage.articlesUsed) / limits.articlesPerMonth * 100),
      aiImprovements: limits.aiImprovementsPerMonth === 999999 ? 0 : Math.round((currentPeriodUsage.aiImprovementsUsed) / limits.aiImprovementsPerMonth * 100),
      sectionRegenerations: limits.sectionRegenerationsPerMonth === 999999 ? 0 : Math.round((currentPeriodUsage.sectionRegenerationsUsed) / limits.sectionRegenerationsPerMonth * 100),
      researchQueries: limits.researchQueriesPerMonth === 999999 ? 0 : Math.round((currentPeriodUsage.researchQueriesUsed) / limits.researchQueriesPerMonth * 100),
      socialGenerations: limits.socialGenerationsPerMonth === 999999 ? 0 : Math.round((currentPeriodUsage.socialGenerationUsed) / limits.socialGenerationsPerMonth * 100),
    };

    return NextResponse.json({
      plan,
      usage: {
        articlesUsed: currentPeriodUsage.articlesUsed,
        articlesLimit: limits.articlesPerMonth,
        aiImprovementsUsed: currentPeriodUsage.aiImprovementsUsed,
        aiImprovementsLimit: limits.aiImprovementsPerMonth,
        sectionRegenerationsUsed: currentPeriodUsage.sectionRegenerationsUsed,
        sectionRegenerationsLimit: limits.sectionRegenerationsPerMonth,
        researchQueriesUsed: currentPeriodUsage.researchQueriesUsed,
        researchQueriesLimit: limits.researchQueriesPerMonth,
        socialGenerationUsed: currentPeriodUsage.socialGenerationUsed,
        socialGenerationLimit: limits.socialGenerationsPerMonth,
        rolloverArticles: usage.rolloverArticles || 0,
      },
      usagePercentages,
      stats: {
        totalArticles: articles.length,
        totalSites: sitesSnapshot.size,
        statusBreakdown,
        periodStart: usage.periodStart?.toDate?.() || new Date(),
        periodEnd: usage.periodEnd?.toDate?.() || new Date(),
      },
      performance: {
        avgCompletionDays: Math.round(avgCompletionTime * 10) / 10,
        fastestHours: completionTimes.length > 0 ? Math.round(completionTimes[0] * 10) / 10 : 0,
        slowestHours: completionTimes.length > 0 ? Math.round(completionTimes[completionTimes.length - 1] * 10) / 10 : 0,
      },
      insights: {
        topKeywords,
        mostUsedSite: mostUsedSite ? { siteId: mostUsedSite[0], count: mostUsedSite[1] } : null,
        avgWordCount,
      },
      roi: {
        costPerArticle: Math.round(costPerArticle * 100) / 100,
        timeSavedHours: Math.round(timeSavedHours),
        valueGenerated: Math.round(valueGenerated),
        breakEven: planPrice > 0 && valueGenerated > 0 ? Math.round((valueGenerated / planPrice) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, 'read');
