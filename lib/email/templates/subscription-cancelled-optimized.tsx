/**
 * Mobile-Optimized Subscription Cancelled Email
 */

import { BaseEmailTemplate } from './base-template-optimized';

interface SubscriptionCancelledEmailProps {
  userName: string;
  plan: string;
  endDate: string;
  feedbackUrl: string;
  reactivateUrl: string;
  unsubscribeUrl?: string;
}

export function renderSubscriptionCancelledEmail({
  userName,
  plan,
  endDate,
  feedbackUrl,
  reactivateUrl,
  unsubscribeUrl,
}: SubscriptionCancelledEmailProps): string {
  const content = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center">
          <h1 class="mobile-heading" style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 26px; font-weight: 700;">Subscription Cancelled</h1>
          <p class="mobile-text" style="color: #666; font-size: 15px; margin: 0;">We're sorry to see you go</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8f9fa; border-radius: 8px; margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
            Your ${plan} subscription has been cancelled. You'll keep premium access until <strong>${endDate}</strong>.
          </p>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
            After that, you'll switch to the Free plan.
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%); border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2); margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Changed Your Mind?</h3>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
            Reactivate anytime before ${endDate} to keep premium features.
          </p>
          <a href="${reactivateUrl}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: #0a0700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Reactivate Subscription
          </a>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top: 1px solid #e0e0e0; margin-top: 24px;">
      <tr>
        <td style="padding-top: 20px;">
          <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Help Us Improve</h3>
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
            Your feedback helps us build a better product.
          </p>
          <a href="${feedbackUrl}" style="color: #D4AF37; text-decoration: none; font-weight: 600; font-size: 14px;">
            Share Feedback →
          </a>
        </td>
      </tr>
    </table>
  `;

  return BaseEmailTemplate({ 
    content, 
    previewText: 'Subscription cancelled - We hope to see you again',
    unsubscribeUrl 
  });
}
