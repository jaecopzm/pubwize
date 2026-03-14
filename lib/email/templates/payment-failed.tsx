/**
 * Payment Failed Email Template
 */

import { BaseEmailTemplate } from './base-template-optimized';

interface PaymentFailedEmailProps {
  userName: string;
  plan: string;
  amount: string;
  reason: string;
  updatePaymentUrl: string;
}

export function renderPaymentFailedEmail({
  userName,
  plan,
  amount,
  reason,
  updatePaymentUrl,
  unsubscribeUrl = '',
}: PaymentFailedEmailProps & { unsubscribeUrl?: string }): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; padding: 20px; background: #fee; border-radius: 50%; margin-bottom: 20px;">
        <span style="font-size: 48px;">⚠️</span>
      </div>
      <h1 style="color: #1a1a1a; margin: 0 0 10px 0; font-size: 28px;">Payment Failed</h1>
      <p style="color: #666; font-size: 16px; margin: 0;">Action required to keep your ${plan} plan</p>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 15px;">
        <strong>What happened:</strong> We couldn't process your payment of $${amount} for your ${plan} subscription.
      </p>
      <p style="margin: 12px 0 0 0; color: #856404; font-size: 14px;">
        <strong>Reason:</strong> ${reason}
      </p>
    </div>

    <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
      <h3 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 18px;">How to Fix This</h3>
      <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
        <li>Click the button below to update your payment method</li>
        <li>Enter your new payment details</li>
        <li>We'll automatically retry the payment</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${updatePaymentUrl}" style="display: inline-block; background: #dc3545; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Update Payment Method
      </a>
    </div>

    <div style="background: #e7f3ff; border-radius: 8px; padding: 16px; margin-top: 30px;">
      <p style="margin: 0; color: #004085; font-size: 14px; text-align: center;">
        💡 <strong>Tip:</strong> Update your payment method within 7 days to avoid service interruption.
      </p>
    </div>

    <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
      Need help? Reply to this email and we'll assist you right away.
    </p>
  `;

  return BaseEmailTemplate({ 
    content, 
    previewText: `Payment successful - Welcome to ${plan}!`,
    unsubscribeUrl 
  });
}
