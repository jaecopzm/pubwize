/**
 * Test Email Endpoint
 * For testing email templates in development
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  sendWelcomeEmail, 
  sendArticlePublishedEmail, 
  sendQuotaWarningEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail
} from '@/lib/email/email-service';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { type, email, data } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'welcome':
        await sendWelcomeEmail(email, 'Test User');
        break;

      case 'article_published':
        await sendArticlePublishedEmail({
          userEmail: email,
          userName: 'Test User',
          articleId: 'test-123',
          articleTitle: 'How to Create SEO Content with AI',
          wordPressUrl: 'https://example.com/article',
        });
        break;

      case 'quota_warning':
        await sendQuotaWarningEmail({
          userEmail: email,
          userName: 'Test User',
          currentUsage: 4,
          limit: 5,
          percentage: 80,
        });
        break;

      case 'quota_exceeded':
        await sendQuotaWarningEmail({
          userEmail: email,
          userName: 'Test User',
          currentUsage: 5,
          limit: 5,
          percentage: 100,
        });
        break;

      case 'payment_success':
        await sendPaymentSuccessEmail({
          userEmail: email,
          userName: data?.userName || 'Test User',
          plan: data?.plan || 'Pro',
          amount: data?.amount || '29',
          billingCycle: data?.billingCycle || 'monthly',
          nextBillingDate: data?.nextBillingDate || 'February 1, 2025',
        });
        break;

      case 'payment_failed':
        await sendPaymentFailedEmail({
          userEmail: email,
          userName: data?.userName || 'Test User',
          plan: data?.plan || 'Pro',
          amount: data?.amount || '29',
          reason: data?.reason || 'Card declined',
        });
        break;

      case 'subscription_cancelled':
        await sendSubscriptionCancelledEmail({
          userEmail: email,
          userName: data?.userName || 'Test User',
          plan: data?.plan || 'Pro',
          endDate: data?.endDate || 'February 1, 2025',
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent to ${email}`,
    });
  } catch (error) {
    console.error('Failed to send test email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
