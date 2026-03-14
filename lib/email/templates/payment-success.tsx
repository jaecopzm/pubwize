/**
 * Payment Success Email Template
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
}: PaymentSuccessEmailProps): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; padding: 20px; background: linear-gradient(135deg, #D4AF37 0%, #008080 100%); border-radius: 50%; margin-bottom: 20px;">
        <span style="font-size: 48px;">✅</span>
      </div>
      <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 28px;">Payment Successful!</h1>
      <p style="color: #666; font-size: 16px; margin: 0;">Welcome to ${plan}</p>
    </div>

    <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
      <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 20px;">Payment Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #1a1a1a; font-weight: 600; text-align: right;">${plan}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #1a1a1a; font-weight: 600; text-align: right;">$${amount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Billing Cycle</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0; color: #1a1a1a; font-weight: 600; text-align: right;">${billingCycle === 'annual' ? 'Annual' : 'Monthly'}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666;">Next Billing Date</td>
          <td style="padding: 12px 0; color: #1a1a1a; font-weight: 600; text-align: right;">${nextBillingDate}</td>
        </tr>
      </table>
    </div>

    <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 128, 128, 0.1) 100%); border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid rgba(212, 175, 55, 0.2);">
      <h3 style="color: #1a1a1a; margin: 0 0 12px 0; font-size: 18px;">🎉 What's Next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
        <li>Start creating unlimited content</li>
        <li>Access all premium features</li>
        <li>Get priority support</li>
        <li>Manage your subscription anytime</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: #0a0700; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Dashboard →
      </a>
    </div>

    <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
      Questions? Reply to this email or visit our <a href="${dashboardUrl}/settings" style="color: #D4AF37;">help center</a>.
    </p>
  `;

  return BaseEmailTemplate({ content });
}
