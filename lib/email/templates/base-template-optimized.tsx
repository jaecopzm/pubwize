/**
 * Mobile-Optimized Base Email Template
 * Responsive HTML email template with Pubwize branding and unsubscribe
 */

interface BaseTemplateProps {
  content: string;
  previewText?: string;
  unsubscribeUrl?: string;
}

export function BaseEmailTemplate({ content, previewText, unsubscribeUrl }: BaseTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Pubwize</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .mobile-padding {
        padding: 16px !important;
      }
      .mobile-text {
        font-size: 14px !important;
      }
      .mobile-heading {
        font-size: 22px !important;
      }
      .mobile-button {
        padding: 12px 24px !important;
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #f5f5f5;">${previewText}</div>` : ''}
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #008080 100%); padding: 24px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Pubwize</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 24px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                      Questions? Reply to this email - we read every message!
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280;">
                      © ${new Date().getFullYear()} Pubwize. All rights reserved.
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 12px;">
                      <a href="https://pubwize.com" style="color: #D4AF37; text-decoration: none;">Website</a>
                      <span style="color: #9ca3af;"> • </span>
                      <a href="https://pubwize.com/dashboard/settings" style="color: #D4AF37; text-decoration: none;">Settings</a>
                      <span style="color: #9ca3af;"> • </span>
                      <a href="https://pubwize.com/contact" style="color: #D4AF37; text-decoration: none;">Support</a>
                    </p>
                    ${unsubscribeUrl ? `
                    <p style="margin: 12px 0 0 0; font-size: 11px; color: #9ca3af;">
                      <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from these emails</a>
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
