/**
 * Article Published Email Template
 */

export function renderArticlePublishedEmail({
  userName,
  articleTitle,
  articleUrl,
  wordPressUrl,
}: {
  userName: string;
  articleTitle: string;
  articleUrl: string;
  wordPressUrl: string;
}): string {
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
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #111827;">Article Published Successfully! 🎉</h2>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                      Hi ${userName},
                    </p>
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
                      Great news! Your article "<strong>${articleTitle}</strong>" has been successfully published to your WordPress site.
                    </p>
                    <table role="presentation" style="width: 100%; margin: 16px 0; background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #065f46;">✅ Published Successfully</p>
                          <p style="margin: 0; font-size: 14px; color: #065f46;">
                            Your article is now live and ready to start ranking in search engines!
                          </p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" style="margin: 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="${wordPressUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #D4AF37 0%, #14B8A6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin-right: 8px;">
                            View on WordPress
                          </a>
                          <a href="${articleUrl}" style="display: inline-block; padding: 14px 32px; background: #ffffff; color: #D4AF37; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; border: 2px solid #D4AF37;">
                            View in Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>
                    <h3 style="margin: 24px 0 12px 0; font-size: 18px; color: #111827;">Next Steps</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                      <li style="margin-bottom: 8px;">Share your article on social media</li>
                      <li style="margin-bottom: 8px;">Monitor your rankings in search engines</li>
                      <li style="margin-bottom: 8px;">Create more content to build authority</li>
                    </ul>
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
