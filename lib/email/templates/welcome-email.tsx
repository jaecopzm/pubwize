/**
 * Welcome Email Template
 * Sent when user signs up
 */

import { BaseTemplate, Heading, Paragraph, Button, InfoBox } from './base-template';

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
}

export function WelcomeEmail({ userName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <BaseTemplate previewText="Welcome to Pubwize! Let's get you started.">
      <Heading>Welcome to Pubwize, {userName}! 🎉</Heading>
      
      <Paragraph>
        We're thrilled to have you on board! You're now part of a community creating
        rank-ready SEO content in minutes with AI.
      </Paragraph>

      <InfoBox type="success" title="Your Account is Ready">
        <p style={{ margin: 0 }}>
          You can now create up to <strong>5 articles per month</strong> on the free plan.
          Upgrade anytime for more articles and advanced features.
        </p>
      </InfoBox>

      <Heading>What You Can Do</Heading>
      
      <table role="presentation" style={{ width: '100%', margin: '16px 0' }}>
        <tr>
          <td style={{ padding: '12px 0' }}>
            <strong style={{ color: '#D4AF37' }}>✨ AI Article Generation</strong>
            <br />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Create full-length, SEO-ready articles from a single keyword in under 2 minutes
            </span>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0' }}>
            <strong style={{ color: '#14B8A6' }}>📊 Real-Time SEO Scoring</strong>
            <br />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Built-in content grader shows exactly which tweaks push you to page one
            </span>
          </td>
        </tr>
        <tr>
          <td style={{ padding: '12px 0' }}>
            <strong style={{ color: '#D4AF37' }}>🚀 1-Click WordPress Publishing</strong>
            <br />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              Push finished articles to any WordPress site with images and metadata
            </span>
          </td>
        </tr>
      </table>

      <Button href={dashboardUrl}>Go to Dashboard</Button>

      <Paragraph style={{ fontSize: '14px', color: '#6b7280' }}>
        Need help getting started? Check out our{' '}
        <a href="https://pubwize.com/docs" style={{ color: '#D4AF37' }}>
          documentation
        </a>{' '}
        or reply to this email with any questions.
      </Paragraph>
    </BaseTemplate>
  );
}

export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  // This would use a React renderer like @react-email/render
  // For now, we'll return a simple HTML string
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #D4AF37 0%, #14B8A6 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Pubwize</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #111827;">Welcome to Pubwize, ${props.userName}! 🎉</h2>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                      We're thrilled to have you on board! You're now part of a community creating rank-ready SEO content in minutes with AI.
                    </p>
                    <table role="presentation" style="width: 100%; margin: 16px 0; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #065f46;">Your Account is Ready</p>
                          <p style="margin: 0; font-size: 14px; color: #065f46;">
                            You can now create up to <strong>5 articles per month</strong> on the free plan. Upgrade anytime for more articles and advanced features.
                          </p>
                        </td>
                      </tr>
                    </table>
                    <h2 style="margin: 24px 0 16px 0; font-size: 20px; color: #111827;">What You Can Do</h2>
                    <table role="presentation" style="width: 100%; margin: 16px 0;">
                      <tr>
                        <td style="padding: 12px 0;">
                          <strong style="color: #D4AF37;">✨ AI Article Generation</strong><br>
                          <span style="font-size: 14px; color: #6b7280;">Create full-length, SEO-ready articles from a single keyword in under 2 minutes</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <strong style="color: #14B8A6;">📊 Real-Time SEO Scoring</strong><br>
                          <span style="font-size: 14px; color: #6b7280;">Built-in content grader shows exactly which tweaks push you to page one</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <strong style="color: #D4AF37;">🚀 1-Click WordPress Publishing</strong><br>
                          <span style="font-size: 14px; color: #6b7280;">Push finished articles to any WordPress site with images and metadata</span>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="${props.dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #D4AF37 0%, #14B8A6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 16px 0 0 0; font-size: 14px; color: #6b7280;">
                      Need help getting started? Check out our <a href="https://pubwize.com/docs" style="color: #D4AF37;">documentation</a> or reply to this email with any questions.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">© ${new Date().getFullYear()} Pubwize. All rights reserved.</p>
                    <p style="margin: 0 0 12px 0; font-size: 12px; color: #9ca3af;">AI-Powered SEO Content Platform</p>
                    <p style="margin: 0; font-size: 12px;">
                      <a href="https://pubwize.com" style="color: #D4AF37; text-decoration: none;">Visit Website</a> • 
                      <a href="https://pubwize.com/dashboard/settings" style="color: #D4AF37; text-decoration: none;">Settings</a> • 
                      <a href="https://pubwize.com/contact" style="color: #D4AF37; text-decoration: none;">Support</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
