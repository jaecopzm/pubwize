/**
 * Mobile-Optimized Payment Success Email
 */

import { BaseEmailTemplate } from './base-template-optimized';

interface PaymentSuccessEmailProps {
  userName: string;
  plan: string;
  amount: string;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: string;
  dashboardUrl: string;
  unsubscribeUrl?: string;
}

export function renderPaymentSuccessEmail({
  userName,
  plan,
  amount,
  billingCycle,
  nextBillingDate,
  dashboardUrl,
  unsubscribeUrl,
}: PaymentSuccessEmailProps): string {
  const content = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #D4AF37 0%, #008080 100%); border-radius: 50%; text-align: center; line-height: 64px; font-size: 32px;">✅</div>
        </td>
      </tr>
      <tr>
        <td align="center">
          <h1 class="mobile-heading" style="color: #1a1a1a; margin: 0 0 8px 0; font-size: 26px; font-weight: 700;">Payment Successful!</h1>
          <p class="mobile-text" style="color: #666; font-size: 15px; margin: 0;">Welcome to ${plan}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8f9fa; border-radius: 8px; margin: 24px 0;">
      <tr>
        <td style="padding: 20px;">
          <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Payment Details</h2>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px;">Plan</td>
              <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #1a1a1a; font-weight: 600; font-size: 14px;">${plan}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px;">Amount</td>
              <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #1a1a1a; font-weight: 600; font-size: 14px;">$${amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #666; font-size: 14px;">Billing</td>
              <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e0e0e0; color: #1a1a1a; font-weight: 600; font-size: 14px;">${billingCycle === 'annual' ? 'Annual' : 'Monthly'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-size: 14px;">Next Billing</td>
              <td align="right" style="padding: 10px 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">${nextBillingDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%); border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.2); margin: 20px 0;">
      <tr>
        <td style="padding: 20px;">
          <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🎉 What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.7; font-size: 14px;">
            <li>Create unlimited content</li>
            <li>Access premium features</li>
            <li>Get priority support</li>
          </ul>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${dashboardUrl}" class="mobile-button" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: #0a0700; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Go to Dashboard →
          </a>
        </td>
      </tr>
    </table>
  `;

  return BaseEmailTemplate({ 
    content, 
    previewText: `Payment successful - Welcome to ${plan}!`,
    unsubscribeUrl 
  });
}
