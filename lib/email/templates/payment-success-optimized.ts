import { base, h1, p, btn, keyValue } from "./base";

export function renderPaymentSuccessEmail({
  userName, plan, amount, billingCycle, nextBillingDate, dashboardUrl, unsubscribeUrl,
}: {
  userName: string; plan: string; amount: string; billingCycle: "monthly" | "annual";
  nextBillingDate: string; dashboardUrl: string; unsubscribeUrl?: string;
}) {
  const content = `
    <p style="text-align:center;font-size:48px;margin:0 0 16px 0;">✅</p>
    ${h1("Payment Successful!")}
    ${p(`Hi ${userName}, your <strong>${plan}</strong> subscription is now active.`)}
    ${keyValue([
      ["Plan", plan],
      ["Amount", `$${amount}`],
      ["Billing", billingCycle === "annual" ? "Annual" : "Monthly"],
      ["Next billing date", nextBillingDate],
    ])}
    ${btn("Go to Dashboard →", dashboardUrl)}
    ${p("Questions about your billing? Reply to this email.", "font-size:14px;color:#6B7280;")}
  `;

  return base(content, { previewText: `Payment confirmed — welcome to ${plan}!`, unsubscribeUrl });
}
