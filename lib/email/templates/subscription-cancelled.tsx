/**
 * Subscription Cancelled Email Template
 */

import { BaseEmailTemplate } from './base-template-optimized';

interface SubscriptionCancelledEmailProps {
  userName: string;
  plan: string;
  endDate: string;
  feedbackUrl: string;
  reactivateUrl: string;
}

export function renderSubscriptionCancelledEmail({
  userName,
  plan,
  endDate,
  feedbackUrl,
  reactivateUrl,
  unsubscribeUrl = '',
}: SubscriptionCancelledEmailProps & { unsubscribeUrl?: string }): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 28px;">Subscription Cancelled</h1>
      <p style="color: #666; font-size: 16px; margin: 0;">We're sorry to see you go</p>
    </div>

    <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Your ${plan} subscription has been cancelled. You'll continue to have access to all premium features until <strong>${endDate}</strong>.
      </p>
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0;">
        After that, your account will automatically switch to the Free plan.
      </p>
    </div>

    <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid rgba(212, 175, 55, 0.2);">
      <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 18px;">Changed Your Mind?</h3>
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        You can reactivate your subscription anytime before ${endDate} to keep your premium features.
      </p>
      <a href="${reactivateUrl}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: #0a0700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Reactivate Subscription
      </a>
    </div>

    <div style="border-top: 1px solid #e0e0e0; padding-top: 24px; margin-top: 30px;">
      <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 18px;">Help Us Improve</h3>
      <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        We'd love to hear why you cancelled. Your feedback helps us build a better product.
      </p>
      <a href="${feedbackUrl}" style="color: #D4AF37; text-decoration: none; font-weight: 600;">
        Share Feedback →
      </a>
    </div>

    <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
      Thank you for being part of Pubwize. We hope to see you again soon!
    </p>
  `;

  return BaseEmailTemplate({ 
    content, 
    previewText: 'Subscription cancelled - We hope to see you again',
    unsubscribeUrl 
  });
}
