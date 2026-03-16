/**
 * Email Service
 * High-level email sending functions
 */

import { sendEmail, EmailType } from './resend-client';
import { renderWelcomeEmail } from './templates/welcome-email';
import { renderArticlePublishedEmail } from './templates/article-published';
import { renderQuotaWarningEmail } from './templates/quota-warning';
import { renderPaymentSuccessEmail } from './templates/payment-success-optimized';
import { renderPaymentFailedEmail } from './templates/payment-failed-optimized';
import { renderSubscriptionCancelledEmail } from './templates/subscription-cancelled-optimized';
// Note: all templates now export from .ts files (not .tsx)
import { logger } from '../logger';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pubwize.com';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userEmail: string, userName: string) {
  try {
    const html = renderWelcomeEmail({
      userName,
      dashboardUrl: `${BASE_URL}/dashboard`,
    });

    await sendEmail({
      to: userEmail,
      subject: 'Welcome to Pubwize! 🎉',
      html,
      type: 'welcome',
    });

    logger.info('Welcome email sent', { email: userEmail });
  } catch (error) {
    logger.error('Failed to send welcome email', error, { email: userEmail });
    throw error;
  }
}

/**
 * Send article published notification
 */
export async function sendArticlePublishedEmail({
  userEmail,
  userName,
  articleId,
  articleTitle,
  wordPressUrl,
}: {
  userEmail: string;
  userName: string;
  articleId: string;
  articleTitle: string;
  wordPressUrl: string;
}) {
  try {
    const html = renderArticlePublishedEmail({
      userName,
      articleTitle,
      articleUrl: `${BASE_URL}/dashboard/articles/${articleId}`,
      wordPressUrl,
    });

    await sendEmail({
      to: userEmail,
      subject: `Article Published: ${articleTitle}`,
      html,
      type: 'article_published',
    });

    logger.info('Article published email sent', { email: userEmail, articleId });
  } catch (error) {
    logger.error('Failed to send article published email', error, {
      email: userEmail,
      articleId,
    });
    // Don't throw - email failure shouldn't break the publish flow
  }
}

/**
 * Send quota warning email
 */
export async function sendQuotaWarningEmail({
  userEmail,
  userName,
  currentUsage,
  limit,
  percentage,
}: {
  userEmail: string;
  userName: string;
  currentUsage: number;
  limit: number;
  percentage: number;
}) {
  try {
    const html = renderQuotaWarningEmail({
      userName,
      currentUsage,
      limit,
      percentage,
      upgradeUrl: `${BASE_URL}/pricing`,
    });

    const isExceeded = percentage >= 100;
    const subject = isExceeded
      ? 'Article Limit Reached - Upgrade to Continue'
      : `You've Used ${percentage}% of Your Monthly Articles`;

    await sendEmail({
      to: userEmail,
      subject,
      html,
      type: isExceeded ? 'quota_exceeded' : 'quota_warning',
    });

    logger.info('Quota warning email sent', {
      email: userEmail,
      percentage,
      isExceeded,
    });
  } catch (error) {
    logger.error('Failed to send quota warning email', error, {
      email: userEmail,
      percentage,
    });
    // Don't throw - email failure shouldn't break the app
  }
}

/**
 * Send WordPress publish success email
 */
export async function sendWordPressPublishSuccessEmail({
  userEmail,
  userName,
  articleTitle,
  wordPressUrl,
  siteName,
}: {
  userEmail: string;
  userName: string;
  articleTitle: string;
  wordPressUrl: string;
  siteName: string;
}) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>WordPress Publish Successful! ✅</h2>
          <p>Hi ${userName},</p>
          <p>Your article "<strong>${articleTitle}</strong>" has been successfully published to <strong>${siteName}</strong>.</p>
          <p><a href="${wordPressUrl}" style="color: #D4AF37;">View Article</a></p>
          <p>Keep creating great content!</p>
          <p>- The Pubwize Team</p>
        </body>
      </html>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Published to WordPress: ${articleTitle}`,
      html,
      type: 'wordpress_publish_success',
    });

    logger.info('WordPress publish success email sent', { email: userEmail });
  } catch (error) {
    logger.error('Failed to send WordPress publish success email', error, {
      email: userEmail,
    });
  }
}

/**
 * Send WordPress publish failed email
 */
export async function sendWordPressPublishFailedEmail({
  userEmail,
  userName,
  articleTitle,
  errorMessage,
  siteName,
}: {
  userEmail: string;
  userName: string;
  articleTitle: string;
  errorMessage: string;
  siteName: string;
}) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>WordPress Publish Failed ❌</h2>
          <p>Hi ${userName},</p>
          <p>We encountered an issue publishing "<strong>${articleTitle}</strong>" to <strong>${siteName}</strong>.</p>
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p>Please check your WordPress site connection and try again.</p>
          <p><a href="${BASE_URL}/dashboard/sites" style="color: #D4AF37;">Manage Sites</a></p>
          <p>Need help? Reply to this email.</p>
          <p>- The Pubwize Team</p>
        </body>
      </html>
    `;

    await sendEmail({
      to: userEmail,
      subject: `WordPress Publish Failed: ${articleTitle}`,
      html,
      type: 'wordpress_publish_failed',
    });

    logger.info('WordPress publish failed email sent', { email: userEmail });
  } catch (error) {
    logger.error('Failed to send WordPress publish failed email', error, {
      email: userEmail,
    });
  }
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail({
  userEmail,
  userName,
  stats,
}: {
  userEmail: string;
  userName: string;
  stats: {
    articlesCreated: number;
    articlesPublished: number;
    totalWords: number;
    avgSeoScore: number;
  };
}) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>Your Weekly Content Summary 📊</h2>
          <p>Hi ${userName},</p>
          <p>Here's what you accomplished this week:</p>
          <ul>
            <li><strong>${stats.articlesCreated}</strong> articles created</li>
            <li><strong>${stats.articlesPublished}</strong> articles published</li>
            <li><strong>${stats.totalWords.toLocaleString()}</strong> words written</li>
            <li><strong>${stats.avgSeoScore}</strong> average SEO score</li>
          </ul>
          <p>Keep up the great work!</p>
          <p><a href="${BASE_URL}/dashboard" style="color: #D4AF37;">View Dashboard</a></p>
          <p>- The Pubwize Team</p>
        </body>
      </html>
    `;

    await sendEmail({
      to: userEmail,
      subject: 'Your Weekly Content Summary',
      html,
      type: 'weekly_summary',
    });

    logger.info('Weekly summary email sent', { email: userEmail });
  } catch (error) {
    logger.error('Failed to send weekly summary email', error, {
      email: userEmail,
    });
  }
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail({
  userEmail,
  userName,
  plan,
  amount,
  billingCycle,
  nextBillingDate,
}: {
  userEmail: string;
  userName: string;
  plan: string;
  amount: string;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: string;
}) {
  try {
    const unsubscribeUrl = `${BASE_URL}/api/email/unsubscribe?email=${encodeURIComponent(userEmail)}&type=marketing`;
    
    const html = renderPaymentSuccessEmail({
      userName,
      plan,
      amount,
      billingCycle,
      nextBillingDate,
      dashboardUrl: `${BASE_URL}/dashboard`,
      unsubscribeUrl,
    });

    await sendEmail({
      to: userEmail,
      subject: `Payment Successful - Welcome to ${plan}! 🎉`,
      html,
      type: 'payment_success',
    });

    logger.info('Payment success email sent', { email: userEmail, plan });
  } catch (error) {
    logger.error('Failed to send payment success email', error, { email: userEmail });
  }
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail({
  userEmail,
  userName,
  plan,
  amount,
  reason,
}: {
  userEmail: string;
  userName: string;
  plan: string;
  amount: string;
  reason: string;
}) {
  try {
    const unsubscribeUrl = `${BASE_URL}/api/email/unsubscribe?email=${encodeURIComponent(userEmail)}&type=marketing`;
    
    const html = renderPaymentFailedEmail({
      userName,
      plan,
      amount,
      reason,
      updatePaymentUrl: `${BASE_URL}/dashboard/settings?tab=billing`,
      unsubscribeUrl,
    });

    await sendEmail({
      to: userEmail,
      subject: '⚠️ Payment Failed - Action Required',
      html,
      type: 'payment_failed',
    });

    logger.info('Payment failed email sent', { email: userEmail });
  } catch (error) {
    logger.error('Failed to send payment failed email', error, { email: userEmail });
  }
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail({
  userEmail,
  userName,
  plan,
  endDate,
}: {
  userEmail: string;
  userName: string;
  plan: string;
  endDate: string;
}) {
  try {
    const unsubscribeUrl = `${BASE_URL}/api/email/unsubscribe?email=${encodeURIComponent(userEmail)}&type=marketing`;
    
    const html = renderSubscriptionCancelledEmail({
      userName,
      plan,
      endDate,
      feedbackUrl: `${BASE_URL}/feedback`,
      reactivateUrl: `${BASE_URL}/dashboard/settings?tab=billing`,
      unsubscribeUrl,
    });

    await sendEmail({
      to: userEmail,
      subject: 'Subscription Cancelled - We\'ll Miss You',
      html,
      type: 'subscription_cancelled',
    });

    logger.info('Subscription cancelled email sent', { email: userEmail });
  } catch (error) {
    logger.error('Failed to send subscription cancelled email', error, { email: userEmail });
  }
}
