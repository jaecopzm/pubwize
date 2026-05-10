import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

export function looksLikeHtml(input: string): boolean {
  const s = input.trim().slice(0, 2000).toLowerCase();
  return s.includes("<p") || s.includes("<h1") || s.includes("<h2") || s.includes("<h3") || s.includes("<ul") || s.includes("<ol") || s.includes("<strong") || s.includes("<em");
}

export function markdownToHtml(markdown: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .processSync(markdown)
  );
}

