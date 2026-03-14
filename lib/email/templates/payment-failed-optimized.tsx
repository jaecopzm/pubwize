/**
 * Mobile-Optimized Payment Failed Email
 */

import { BaseEmailTemplate } from './base-template-optimized';

interface PaymentFailedEmailProps {
  userName: string;
  plan: string;
  amount: string;
  reason: string;
  updatePaymentUrl: string;
  unsubscribeUrl?: string;
}

export function renderPaymentFailedEmail({
  userName,
  plan,
  amount,
  reason,
  updatePaymentUrl,
  unsubscribeUrl,
}: PaymentFailedEmailProps): string {
  const content = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="display: inline-block; width: 64px; height: 64px; background: #fee; border-radius: 50%; text-align: center; line-height: 64px; font-size: 32px;">⚠️</div>
        </td>
      </tr>
      <tr>
        <td align="center">
          <h1 class="mobile-heading" style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 26px; font-weight: 700;">Payment Failed</h1>
          <p class="mobile-text" style="color: #666; font-size: 15px; margin: 0;">Action required for ${plan}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin: 24px 0;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0 0 8px 0; color: #856404; font-size: 14px; font-weight: 600;">
            We couldn't process your $${amount} payment
          </p>
          <p style="margin: 0; color: #856404; font-size: 13px;">
            <strong>Reason:</strong> ${reason}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">How to Fix</h3>
          <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.7; font-size: 14px;">
            <li>Update your payment method</li>
            <li>We'll retry automatically</li>
            <li>Keep your premium access</li>
          </ol>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${updatePaymentUrl}" class="mobile-button" style="display: inline-block; background: #dc3545; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Update Payment Method
          </a>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #e7f3ff; border-radius: 8px; margin-top: 20px;">
      <tr>
        <td align="center" style="padding: 14px;">
          <p style="margin: 0; color: #004085; font-size: 13px;">
            💡 Update within 7 days to avoid service interruption
          </p>
        </td>
      </tr>
    </table>
  `;

  return BaseEmailTemplate({ 
    content, 
    previewText: 'Payment failed - Update your payment method',
    unsubscribeUrl 
  });
}
