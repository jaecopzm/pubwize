/**
 * Pubwize Base Email Template
 *
 * Deliverability best practices applied:
 * - Table-based layout (Outlook/Gmail safe)
 * - All styles inlined (no external CSS)
 * - MSO conditionals for Outlook
 * - Plain-text preheader with filler to prevent body preview bleed
 * - Physical address in footer (CAN-SPAM / GDPR)
 * - One-click unsubscribe link
 * - No background images, no JavaScript
 * - Alt text on all images
 * - Max width 600px
 */

const BRAND = {
  gold: "#D4AF37",
  teal: "#14B8A6",
  dark: "#111827",
  muted: "#6B7280",
  light: "#F9FAFB",
  border: "#E5E7EB",
  white: "#FFFFFF",
};

// Invisible filler prevents email clients from showing body text in preview
function preheader(text: string) {
  const filler = "&nbsp;".repeat(Math.max(0, 140 - text.length));
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;">${text}${filler}</div>`;
}

export interface BaseTemplateOptions {
  previewText?: string;
  unsubscribeUrl?: string;
  /** Physical mailing address for CAN-SPAM compliance */
  address?: string;
}

export function base(content: string, opts: BaseTemplateOptions = {}): string {
  const {
    previewText = "",
    unsubscribeUrl,
    address = "Pubwize, 1234 Content St, San Francisco, CA 94103",
  } = opts;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Pubwize</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .wrap{width:100%!important;max-width:100%!important}
      .pad{padding:24px 16px!important}
      .h1{font-size:22px!important}
      .btn{padding:13px 24px!important;font-size:14px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;word-spacing:normal;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${previewText ? preheader(previewText) : ""}
<!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F3F4F6;"><tr><td><![endif]-->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F3F4F6;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Card -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="wrap" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.gold} 0%,${BRAND.teal} 100%);padding:28px 32px;text-align:center;">
            <!--[if mso]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="padding:0;"><![endif]-->
            <img src="https://pubwize.com/PubWize.png" alt="Pubwize" width="140" height="auto" style="display:inline-block;height:36px;width:auto;max-width:160px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
            <!--[if mso]></td></tr></table><![endif]-->
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="pad" style="padding:40px 40px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:${BRAND.dark};">
            ${content}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;"><div style="height:1px;background-color:${BRAND.border};"></div></td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background-color:${BRAND.light};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:${BRAND.muted};text-align:center;line-height:1.6;">
            <p style="margin:0 0 8px 0;">
              <a href="https://pubwize.com" style="color:${BRAND.gold};text-decoration:none;font-weight:600;">Pubwize</a>
              &nbsp;·&nbsp;
              <a href="https://pubwize.com/dashboard/settings" style="color:${BRAND.muted};text-decoration:none;">Account Settings</a>
              &nbsp;·&nbsp;
              <a href="https://pubwize.com/contact" style="color:${BRAND.muted};text-decoration:none;">Support</a>
            </p>
            <p style="margin:0 0 8px 0;color:${BRAND.muted};">${address}</p>
            <p style="margin:0 0 8px 0;">© ${new Date().getFullYear()} Pubwize. All rights reserved.</p>
            ${unsubscribeUrl ? `<p style="margin:0;"><a href="${unsubscribeUrl}" style="color:${BRAND.muted};text-decoration:underline;font-size:11px;">Unsubscribe</a></p>` : ""}
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>
<!--[if mso | IE]></td></tr></table><![endif]-->
</body>
</html>`;
}

// ─── Reusable content blocks ────────────────────────────────────────────────

export function h1(text: string) {
  return `<h1 class="h1" style="margin:0 0 16px 0;font-size:26px;font-weight:700;color:${BRAND.dark};line-height:1.3;">${text}</h1>`;
}

export function h2(text: string) {
  return `<h2 style="margin:24px 0 12px 0;font-size:18px;font-weight:600;color:${BRAND.dark};">${text}</h2>`;
}

export function p(text: string, style = "") {
  return `<p style="margin:0 0 16px 0;font-size:15px;color:#374151;line-height:1.7;${style}">${text}</p>`;
}

export function btn(label: string, href: string, variant: "primary" | "danger" = "primary") {
  const bg = variant === "danger" ? "#DC2626" : `linear-gradient(135deg,${BRAND.gold} 0%,${BRAND.teal} 100%)`;
  const color = variant === "danger" ? "#ffffff" : "#0a0700";
  return `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="border-radius:8px;background:${bg};">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" stroke="f" fillcolor="${variant === "danger" ? "#DC2626" : BRAND.gold}"><w:anchorlock/><center style="color:${color};font-family:sans-serif;font-size:15px;font-weight:bold;">${label}</center></v:roundrect><![endif]-->
      <!--[if !mso]><!--><a href="${href}" class="btn" style="display:inline-block;padding:14px 32px;background:${bg};color:${color};text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;mso-hide:all;">${label}</a><!--<![endif]-->
    </td>
  </tr>
</table>`;
}

export function infoBox(content: string, type: "success" | "warning" | "info" = "info") {
  const colors = {
    success: { bg: "#F0FDF4", border: "#16A34A", text: "#15803D" },
    warning: { bg: "#FFFBEB", border: "#D97706", text: "#92400E" },
    info:    { bg: "#EFF6FF", border: "#2563EB", text: "#1E40AF" },
  };
  const c = colors[type];
  return `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:${c.bg};border-left:4px solid ${c.border};border-radius:4px;">
  <tr><td style="padding:16px;font-size:14px;color:${c.text};line-height:1.6;">${content}</td></tr>
</table>`;
}

export function divider() {
  return `<div style="height:1px;background-color:${BRAND.border};margin:24px 0;"></div>`;
}

export function keyValue(rows: [string, string][]) {
  const cells = rows.map(([k, v]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.muted};">${k}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;font-weight:600;color:${BRAND.dark};">${v}</td>
    </tr>`).join("");
  return `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background-color:${BRAND.light};border-radius:8px;">
  <tr><td style="padding:20px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${cells}</table>
  </td></tr>
</table>`;
}
