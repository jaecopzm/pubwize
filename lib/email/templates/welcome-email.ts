import { base, h1, p, btn, infoBox } from "./base";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pubwize.com";

export function renderWelcomeEmail({ userName, dashboardUrl }: { userName: string; dashboardUrl: string }) {
  const unsubscribeUrl = `${BASE_URL}/api/email/unsubscribe?email=&type=marketing`;

  const content = `
    ${h1(`Welcome to Pubwize, ${userName}! 🎉`)}
    ${p("You're now part of a community creating rank-ready SEO content in minutes with AI.")}
    ${infoBox(`<strong>Your account is ready.</strong> You can create up to <strong>5 articles per month</strong> on the free plan. Upgrade anytime for more.`, "success")}
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
      <tr><td style="padding:10px 0;font-size:15px;color:#374151;"><strong style="color:#D4AF37;">✨ AI Article Generation</strong><br><span style="font-size:14px;color:#6B7280;">Full SEO articles from a single keyword in under 2 minutes.</span></td></tr>
      <tr><td style="padding:10px 0;font-size:15px;color:#374151;"><strong style="color:#14B8A6;">📊 Real-Time SEO Scoring</strong><br><span style="font-size:14px;color:#6B7280;">Built-in grader shows exactly which tweaks push you to page one.</span></td></tr>
      <tr><td style="padding:10px 0;font-size:15px;color:#374151;"><strong style="color:#D4AF37;">🚀 1-Click WordPress Publishing</strong><br><span style="font-size:14px;color:#6B7280;">Push finished articles to any WordPress site with images and metadata.</span></td></tr>
    </table>
    ${btn("Go to Dashboard →", dashboardUrl)}
    ${p(`Need help? Reply to this email — we read every message.`, "font-size:14px;color:#6B7280;")}
  `;

  return base(content, { previewText: `Welcome to Pubwize, ${userName}! Let's get you started.`, unsubscribeUrl });
}
