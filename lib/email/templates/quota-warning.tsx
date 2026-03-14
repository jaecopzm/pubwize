/**
 * Quota Warning Email Template
 */

export function renderQuotaWarningEmail({
  userName,
  currentUsage,
  limit,
  percentage,
  upgradeUrl,
}: {
  userName: string;
  currentUsage: number;
  limit: number;
  percentage: number;
  upgradeUrl: string;
}): string {
  const isExceeded = percentage >= 100;
  const title = isExceeded
    ? 'Article Limit Reached'
    : `You've Used ${percentage}% of Your Articles`;

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
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #111827;">${title}</h2>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                      ${
                        isExceeded
                          ? `You've reached your monthly limit of ${limit} articles. Upgrade to continue creating content!`
                          : `You've used ${currentUsage} of your ${limit} monthly articles. Consider upgrading for unlimited content creation.`
                      }
                    </p>
                    <table role="presentation" style="width: 100%; margin: 16px 0; background-color: ${
                      isExceeded ? '#fef2f2' : '#fffbeb'
                    }; border: 2px solid ${
    isExceeded ? '#ef4444' : '#f59e0b'
  }; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: ${
                            isExceeded ? '#991b1b' : '#92400e'
                          };">
                            ${isExceeded ? '⚠️ Limit Reached' : '📊 Usage Alert'}
                          </p>
                          <p style="margin: 0; font-size: 14px; color: ${
                            isExceeded ? '#991b1b' : '#92400e'
                          };">
                            <strong>${currentUsage} / ${limit}</strong> articles used this month (${percentage}%)
                          </p>
                        </td>
                      </tr>
                    </table>
                    <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: #111827;">Upgrade Benefits</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                      <li style="margin-bottom: 8px;"><strong>Starter Plan:</strong> 15 articles/month</li>
                      <li style="margin-bottom: 8px;"><strong>Pro Plan:</strong> 60 articles/month</li>
                      <li style="margin-bottom: 8px;">Priority support</li>
                      <li style="margin-bottom: 8px;">Advanced AI features</li>
                    </ul>
                    <table role="presentation" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="${upgradeUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #D4AF37 0%, #14B8A6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
                            Upgrade Now
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280;">© ${new Date().getFullYear()} Pubwize. All rights reserved.</p>
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
