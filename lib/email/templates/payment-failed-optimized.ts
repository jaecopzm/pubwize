import { base, h1, p, btn, infoBox } from "./base";

export function renderPaymentFailedEmail({
  userName, plan, amount, reason, updatePaymentUrl, unsubscribeUrl,
}: {
  userName: string; plan: string; amount: string; reason: string;
  updatePaymentUrl: string; unsubscribeUrl?: string;
}) {
  const content = `
    <p style="text-align:center;font-size:48px;margin:0 0 16px 0;">⚠️</p>
    ${h1("Payment Failed")}
    ${p(`Hi ${userName}, we couldn't process your <strong>$${amount}</strong> payment for <strong>${plan}</strong>.`)}
    ${infoBox(`<strong>Reason:</strong> ${reason}<br><br>Please update your payment method to keep your subscription active. We'll retry automatically once updated.`, "warning")}
    ${btn("Update Payment Method", updatePaymentUrl, "danger")}
    ${p("Update within 7 days to avoid service interruption. Reply to this email if you need help.", "font-size:14px;color:#6B7280;")}
  `;

  return base(content, { previewText: "Action required: your payment failed", unsubscribeUrl });
}
