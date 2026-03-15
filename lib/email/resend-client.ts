/**
 * Resend Email Client
 * Handles all email sending through Resend API
 */

import { Resend } from 'resend';

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: 'Pubwize <hello@pubwize.com>',
  replyTo: 'support@pubwize.com',
} as const;

// Email types for tracking
export type EmailType =
  | 'welcome'
  | 'article_published'
  | 'quota_warning'
  | 'quota_exceeded'
  | 'wordpress_publish_success'
  | 'wordpress_publish_failed'
  | 'weekly_summary'
  | 'password_reset'
  | 'email_verification'
  | 'payment_success'
  | 'payment_failed'
  | 'subscription_cancelled'
  | 'subscription_renewed';

/**
 * Send email with Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  type,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  type: EmailType;
}) {
  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email] RESEND_API_KEY not configured. Email not sent:`, {
      to,
      subject,
      type,
    });
    
    // In development, log the email content
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email Preview]', {
        to,
        subject,
        type,
        htmlPreview: html.substring(0, 200) + '...',
      });
    }
    
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      html,
      text,
      replyTo: EMAIL_CONFIG.replyTo,
      tags: [
        { name: 'type', value: type },
        { name: 'environment', value: process.env.NODE_ENV || 'development' },
      ],
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('[Email] Sent successfully:', { id: data?.id, to, type });
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    throw error;
  }
}

/**
 * Send batch emails
 */
export async function sendBatchEmails(
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
    type: EmailType;
  }>
) {
  try {
    const results = await Promise.allSettled(
      emails.map((email) => sendEmail(email))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Batch email results: ${successful} sent, ${failed} failed`);

    return {
      successful,
      failed,
      results,
    };
  } catch (error) {
    console.error('Failed to send batch emails:', error);
    throw error;
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
