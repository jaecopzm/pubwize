// This is the enhanced article editor with premium features
// Replace the content of page.tsx with this file

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Premium feature imports
import { ReadabilityScoreCard, ReadabilityImprovementPanel } from "@/components/readability";
import { SERPPreviewCard, SERPMetaEditor } from "@/components/serp-preview";
import { WordPressPublishPanel } from "@/components/wordpress";
import { ExportDialog } from "@/components/export";
import { calculateReadabilityScores, detectReadabilityIssues } from "@/lib/readability";
import { getAuthHeaders } from "@/lib/hooks/use-auth";

// Import your existing article components
// (Keep all your existing BriefPanel, OutlinePanel, DraftPanel, SEOPanel components)

export default function EnhancedArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  // Existing state
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Premium features state
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [wordPressSites, setWordPressSites] = useState([]);
  
  // Readability analysis (debounced)
  const [readabilityScores, setReadabilityScores] = useState<any>(null);
  const [readabilityIssues, setReadabilityIssues] = useState<any[]>([]);

  // Fetch article
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`, {});

        if (res.ok) {
          const data = await res.json();
          setArticle(data);
          setMetaTitle(data.metaTitle || data.keyword || "");
          setMetaDescription(data.metaDescription || "");
        }
      } catch (error) {
        console.error("Failed to fetch article:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  // Fetch WordPress sites
  useEffect(() => {
    fetchWordPressSites();
  }, []);

  const fetchWordPressSites = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/wordpress/sites", { headers });
      
      if (response.ok) {
        const data = await response.json();
        setWordPressSites(data.sites || []);
      }
    } catch (error) {
      console.error("Failed to fetch WordPress sites:", error);
    }
  };

  // Readability analysis (debounced)
  useEffect(() => {
    const content = article?.draft?.content || "";
    
    if (!content) return;

    const timer = setTimeout(() => {
      const scores = calculateReadabilityScores(content);
      const issues = detectReadabilityIssues(content);
      setReadabilityScores(scores);
      setReadabilityIssues(issues);
    }, 2000);

    return () => clearTimeout(timer);
  }, [article?.draft?.content]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <button
            onClick={() => router.push("/dashboard/articles")}
            className="mt-4 text-sm text-violet-400 underline"
          >
            ← Back to Articles
          </button>
        </div>
      </div>
    );
  }

  const content = article.draft?.content || "";
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-screen">
      {/* Main Content Area - Your existing article editor */}
      <div className="flex-1 overflow-y-auto">
        {/* Keep your existing article editor UI here */}
        <div className="p-8">
          <button
            onClick={() => router.push("/dashboard/articles")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h1 className="text-2xl font-bold">{article.keyword}</h1>
            </div>
            <button
              onClick={() => setShowExportDialog(true)}
              className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Export
            </button>
          </div>

          {/* Your existing article content panels */}
          {/* Add your BriefPanel, OutlinePanel, DraftPanel, SEOPanel here */}
        </div>
      </div>

      {/* Premium Features Sidebar */}
      <div className="w-96 border-l bg-muted/30 overflow-y-auto">
        <Tabs defaultValue="analysis" className="p-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          {/* Readability Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4 mt-4">
            <ReadabilityScoreCard
              scores={readabilityScores}
              wordCount={wordCount}
            />
            <ReadabilityImprovementPanel issues={readabilityIssues} />
          </TabsContent>

          {/* SEO & SERP Preview Tab */}
          <TabsContent value="seo" className="space-y-4 mt-4">
            <SERPMetaEditor
              title={metaTitle}
              description={metaDescription}
              onTitleChange={setMetaTitle}
              onDescriptionChange={setMetaDescription}
            />
            <SERPPreviewCard
              title={metaTitle}
              description={metaDescription}
              url={article.publishedUrl || "yoursite.com/article"}
            />
          </TabsContent>

          {/* WordPress Publishing Tab */}
          <TabsContent value="publish" className="space-y-4 mt-4">
            <WordPressPublishPanel
              articleId={articleId}
              title={article.keyword || ""}
              content={content}
              sites={wordPressSites}
              publishedUrl={article.publishedUrl}
              onPublishSuccess={(url) => {
                toast.success("Published to WordPress!");
                setArticle({ ...article, publishedUrl: url });
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        article={{
          title: article.keyword || "",
          content: content,
          metaTitle: metaTitle,
          metaDescription: metaDescription,
          author: article.authorName || "Author",
          createdAt: article.createdAt ? new Date(article.createdAt.seconds * 1000) : new Date(),
          updatedAt: article.updatedAt ? new Date(article.updatedAt.seconds * 1000) : new Date(),
        }}
      />
    </div>
  );
}
