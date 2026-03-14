/**
 * Article Export Utilities
 * Client-side utilities for exporting articles to various formats
 */

export interface ExportOptions {
  includeImages?: boolean;
  includeMetadata?: boolean;
}

export interface ArticleExportData {
  title: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Generate filename from article title
 */
function generateFilename(title: string, extension: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${sanitized || "article"}.${extension}`;
}

/**
 * Export article as HTML
 */
export function exportToHTML(
  data: ArticleExportData,
  options: ExportOptions = {}
): { content: string; filename: string } {
  const { includeImages = true, includeMetadata = true } = options;

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>`;

  if (includeMetadata && data.metaDescription) {
    html += `\n  <meta name="description" content="${escapeHtml(data.metaDescription)}">`;
  }

  html += `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.3;
    }
    h1 { font-size: 2.5em; }
    h2 { font-size: 2em; }
    h3 { font-size: 1.5em; }
    p { margin-bottom: 1em; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; height: auto; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
    .metadata { color: #666; font-size: 0.9em; margin-bottom: 2em; }
  </style>
</head>
<body>
  <article>
    <h1>${escapeHtml(data.title)}</h1>`;

  if (includeMetadata) {
    html += `\n    <div class="metadata">`;
    if (data.author) {
      html += `\n      <p>By ${escapeHtml(data.author)}</p>`;
    }
    if (data.createdAt) {
      html += `\n      <p>Published: ${data.createdAt.toLocaleDateString()}</p>`;
    }
    html += `\n    </div>`;
  }

  // Process content
  let content = data.content;
  if (!includeImages) {
    content = content.replace(/<img[^>]*>/g, "");
  }

  html += `\n    ${content}
  </article>
</body>
</html>`;

  return {
    content: html,
    filename: generateFilename(data.title, "html"),
  };
}

/**
 * Export article as Markdown
 */
export function exportToMarkdown(
  data: ArticleExportData,
  options: ExportOptions = {}
): { content: string; filename: string } {
  const { includeImages = true, includeMetadata = true } = options;

  let markdown = "";

  // Add frontmatter if metadata is included
  if (includeMetadata) {
    markdown += "---\n";
    markdown += `title: "${data.title}"\n`;
    if (data.metaTitle) {
      markdown += `metaTitle: "${data.metaTitle}"\n`;
    }
    if (data.metaDescription) {
      markdown += `metaDescription: "${data.metaDescription}"\n`;
    }
    if (data.author) {
      markdown += `author: "${data.author}"\n`;
    }
    if (data.createdAt) {
      markdown += `date: ${data.createdAt.toISOString()}\n`;
    }
    markdown += "---\n\n";
  }

  // Add title
  markdown += `# ${data.title}\n\n`;

  // Convert HTML content to Markdown
  let content = htmlToMarkdown(data.content);

  if (!includeImages) {
    content = content.replace(/!\[.*?\]\(.*?\)/g, "");
  }

  markdown += content;

  return {
    content: markdown,
    filename: generateFilename(data.title, "md"),
  };
}

/**
 * Convert HTML to Markdown (simplified)
 */
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");

  // Bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

  // Links
  markdown = markdown.replace(
    /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );

  // Images
  markdown = markdown.replace(
    /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
    "![$2]($1)"
  );
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, "![]($1)");

  // Lists
  markdown = markdown.replace(/<ul[^>]*>/gi, "");
  markdown = markdown.replace(/<\/ul>/gi, "\n");
  markdown = markdown.replace(/<ol[^>]*>/gi, "");
  markdown = markdown.replace(/<\/ol>/gi, "\n");
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");

  // Paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");

  // Code
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gi, "```\n$1\n```\n\n");

  // Blockquotes
  markdown = markdown.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
    "> $1\n\n"
  );

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "");

  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  markdown = markdown.trim();

  return markdown;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Trigger browser download
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
