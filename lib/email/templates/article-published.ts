import { base, h1, p, btn } from "./base";

export function renderArticlePublishedEmail({
  userName, articleTitle, articleUrl, wordPressUrl,
}: {
  userName: string; articleTitle: string; articleUrl: string; wordPressUrl: string;
}) {
  const content = `
    <p style="text-align:center;font-size:48px;margin:0 0 16px 0;">🚀</p>
    ${h1("Article Published!")}
    ${p(`Hi ${userName}, <strong>${articleTitle}</strong> is now live on WordPress.`)}
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0;">
      <tr>
        <td style="padding-right:16px;">${btn("View on WordPress", wordPressUrl)}</td>
        <td>${btn("Edit in Pubwize", articleUrl)}</td>
      </tr>
    </table>
    ${p("Keep the momentum going — create your next article.", "font-size:14px;color:#6B7280;")}
  `;

  return base(content, { previewText: `"${articleTitle}" is now live!` });
}
