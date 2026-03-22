import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
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

    const { userId: uid } = await auth();
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = adminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const planTier = userData.planTier || userData.plan || 'free';
    const plan: PlanTier = planTier === 'free' || planTier === 'starter' || planTier === 'pro' ? planTier : 'free';
    
    // For analytics, always show Pro limits since this is a Pro-only feature
    const displayPlan: PlanTier = 'pro';
    const limits = PLANS[displayPlan].limits;
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
      draft: articles.filter(a => a.status === 'draft' || a.status === 'draft_generated').length,
      optimized: articles.filter(a => a.status === 'optimized').length,
    };

    // Performance Metrics - only for completed articles
    const completedArticles = articles.filter(a => 
      (a.status === 'optimized' || a.status === 'draft_generated') && 
      a.createdAt && 
      a.updatedAt
    );
    
    const completionTimes = completedArticles
      .map(a => {
        const start = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const end = a.updatedAt?.toDate?.() || new Date(a.updatedAt);
        const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        return Math.max(diffMinutes, 1); // At least 1 minute
      })
      .filter(time => time > 0 && time < 120) // Only count articles completed within 2 hours (realistic for AI generation)
      .sort((a, b) => a - b);

    const avgCompletionMinutes = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Content Insights - only count unique keywords
    const keywordCounts = articles.reduce((acc: any, a) => {
      if (a.keyword) {
        const normalized = a.keyword.toLowerCase().trim();
        acc[normalized] = (acc[normalized] || 0) + 1;
      }
      return acc;
    }, {});
    
    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([keyword, count]) => ({ keyword, count }));

    // Site usage
    const siteCounts = articles.reduce((acc: any, a) => {
      if (a.siteId) {
        acc[a.siteId] = (acc[a.siteId] || 0) + 1;
      }
      return acc;
    }, {});
    const mostUsedSite = Object.entries(siteCounts).sort(([, a]: any, [, b]: any) => b - a)[0];

    // Calculate word count from articles with draft content
    const articlesWithContent = articles.filter(a => a.draft?.content && a.draft.content.length > 100);
    const avgWordCount = articlesWithContent.length > 0
      ? Math.round(articlesWithContent.reduce((sum, a) => {
          const content = a.draft?.content || '';
          const text = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[#*_~\[\](){}]/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          return sum + text.split(/\s+/).filter(w => w.length > 0).length;
        }, 0) / articlesWithContent.length)
      : 0;

    // ROI Calculator - more accurate
    const planPrice = plan === 'pro' ? 49 : plan === 'starter' ? 19 : 0;
    const articlesGenerated = currentPeriodUsage.articlesUsed;
    const costPerArticle = articlesGenerated > 0 && planPrice > 0 
      ? (planPrice / articlesGenerated).toFixed(2) 
      : planPrice === 0 ? 'Free' : '0.00';
    const timeSavedHours = Math.round(articlesGenerated * 3.5); // 3.5 hours per article
    const valueGenerated = articlesGenerated * 150; // $150 value per article
    const roiMultiple = planPrice > 0 && valueGenerated > 0 
      ? Math.round((valueGenerated / planPrice) * 10) / 10 
      : 0;

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
      plan: displayPlan, // Return 'pro' for display purposes
      actualPlan: plan, // Keep actual plan for reference
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
        avgCompletionMinutes: completionTimes.length > 0 ? Math.round(avgCompletionMinutes) : 0,
        fastestMinutes: completionTimes.length > 0 ? Math.round(completionTimes[0]) : 0,
        slowestMinutes: completionTimes.length > 0 ? Math.round(completionTimes[completionTimes.length - 1]) : 0,
        completedCount: completedArticles.length,
      },
      insights: {
        topKeywords,
        mostUsedSite: mostUsedSite ? { siteId: mostUsedSite[0], count: mostUsedSite[1] } : null,
        avgWordCount,
        articlesWithContent: articlesWithContent.length,
        totalWords: articlesWithContent.reduce((sum, a) => {
          const content = a.draft?.content || '';
          const text = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]*`/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[#*_~\[\](){}]/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          return sum + text.split(/\s+/).filter(w => w.length > 0).length;
        }, 0),
      },
      roi: {
        costPerArticle,
        timeSavedHours,
        valueGenerated,
        breakEven: roiMultiple,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, 'read');
