import { base, h1, p, btn, infoBox, divider } from "./base";

export function renderSubscriptionCancelledEmail({
  userName, plan, endDate, feedbackUrl, reactivateUrl, unsubscribeUrl,
}: {
  userName: string; plan: string; endDate: string;
  feedbackUrl: string; reactivateUrl: string; unsubscribeUrl?: string;
}) {
  const content = `
    ${h1("Subscription Cancelled")}
    ${p(`Hi ${userName}, your <strong>${plan}</strong> subscription has been cancelled.`)}
    ${infoBox(`You'll keep full premium access until <strong>${endDate}</strong>. After that, your account moves to the free plan.`, "info")}
    ${btn("Reactivate Subscription", reactivateUrl)}
    ${divider()}
    ${p("We'd love to know what we could do better.")}
    <p style="margin:0;font-size:15px;"><a href="${feedbackUrl}" style="color:#D4AF37;font-weight:600;text-decoration:none;">Share feedback →</a></p>
  `;

  return base(content, { previewText: "Your subscription has been cancelled", unsubscribeUrl });
}
