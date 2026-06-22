"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { markdownToHtml } from "@/lib/wordpress/markdown";

export default function ArticlePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const { article } = await res.json();
        const content = article.draft?.content || "";
        setTitle(article.keyword || article.metaTitle || "Untitled");
        setHtml(markdownToHtml(content));
      } catch {
        setHtml("<p class='text-red-400'>Failed to load article.</p>");
      } finally {
        setLoading(false);
      }
    };
    fetchAndRender();
  }, [articleId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0b0f]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0b0f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </button>
          <span className="text-xs text-gray-500">Preview</span>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-white">{title}</h1>
        <div
          className="prose prose-invert prose-violet max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-code:text-violet-300 prose-code:bg-violet-900/30 prose-code:px-1 prose-code:rounded
            pre:bg-gray-900 pre:rounded-lg pre:p-4
            prose-img:rounded-lg prose-img:my-8
            prose-blockquote:border-l-violet-500 prose-blockquote:text-gray-400
            prose-li:text-gray-300
            prose-hr:border-gray-800"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}
