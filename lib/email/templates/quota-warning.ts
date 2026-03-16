import { base, h1, p, btn, infoBox } from "./base";

export function renderQuotaWarningEmail({
  userName, currentUsage, limit, percentage, upgradeUrl,
}: {
  userName: string; currentUsage: number; limit: number; percentage: number; upgradeUrl: string;
}) {
  const exceeded = percentage >= 100;
  const barFill = Math.min(percentage, 100);
  const barColor = percentage >= 100 ? "#DC2626" : percentage >= 80 ? "#D97706" : "#16A34A";

  const content = `
    ${h1(exceeded ? "Article Limit Reached" : `You've used ${percentage}% of your articles`)}
    ${p(`Hi ${userName}, you've used <strong>${currentUsage} of ${limit}</strong> articles this month.`)}
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
      <tr><td style="background-color:#E5E7EB;border-radius:99px;height:10px;overflow:hidden;">
        <div style="width:${barFill}%;height:10px;background-color:${barColor};border-radius:99px;"></div>
      </td></tr>
    </table>
    ${exceeded
      ? infoBox("You've reached your monthly limit. Upgrade to keep creating content.", "warning")
      : infoBox(`You have <strong>${limit - currentUsage}</strong> articles remaining this month.`, "info")
    }
    ${btn("Upgrade Plan →", upgradeUrl)}
    ${p("Upgrade resets immediately — no waiting for the next billing cycle.", "font-size:14px;color:#6B7280;")}
  `;

  return base(content, {
    previewText: exceeded ? "Article limit reached — upgrade to continue" : `${percentage}% of your monthly articles used`,
  });
}
