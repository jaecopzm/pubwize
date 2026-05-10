"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, ExternalLink, AlertCircle, Calendar, RefreshCw, Clock, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/hooks/use-auth";
import type { WordPressSite } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface WordPressPublishPanelProps {
  articleId: string;
  title: string;
  content: string;
  sites: WordPressSite[];
  publishedUrl?: string | null;
  publishedPostId?: number | null;
  featuredImageUrl?: string;
  onPublishSuccess?: (postUrl: string) => void;
}

export function WordPressPublishPanel({
  articleId,
  title,
  content,
  sites,
  publishedUrl,
  publishedPostId,
  featuredImageUrl,
  onPublishSuccess,
}: WordPressPublishPanelProps) {
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>("");
  const [status, setStatus] = React.useState<"draft" | "pending" | "publish" | "future">("draft");
  const [categories, setCategories] = React.useState<string>("");
  const [tags, setTags] = React.useState<string>("");
  const [scheduledDate, setScheduledDate] = React.useState<string>("");
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [siteHealth, setSiteHealth] = React.useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = React.useState(false);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check site health on mount and cache for 5 minutes
  React.useEffect(() => {
    if (sites.length > 0) {
      const cachedHealth = localStorage.getItem('wp-site-health');
      const cachedTime = localStorage.getItem('wp-site-health-time');
      
      if (cachedHealth && cachedTime) {
        const age = Date.now() - parseInt(cachedTime);
        if (age < 5 * 60 * 1000) { // 5 minutes
          setSiteHealth(JSON.parse(cachedHealth));
          return;
        }
      }
      
      checkAllSitesHealth();
    }
  }, [sites]);

  const checkAllSitesHealth = async () => {
    const healthStatus: Record<string, boolean> = {};
    
    for (const site of sites) {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/wordpress/sites/${site.id}/health`, {
          headers,
        });
        
        if (response.ok) {
          const data = await response.json();
          healthStatus[site.id] = data.healthy;
        } else {
          healthStatus[site.id] = false;
        }
      } catch {
        healthStatus[site.id] = false;
      }
    }
    
    if (!mountedRef.current) return;
    setSiteHealth(healthStatus);
    // Cache the results
    localStorage.setItem('wp-site-health', JSON.stringify(healthStatus));
    localStorage.setItem('wp-site-health-time', Date.now().toString());
  };

  const checkSiteHealth = async (siteId: string) => {
    if (!mountedRef.current) return;
    setIsCheckingHealth(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/wordpress/sites/${siteId}/health`, {
        headers,
      });
      
      const data = await response.json();
      
      if (data.healthy) {
        toast.success("Connection is healthy");
        const newHealth = { ...siteHealth, [siteId]: true };
        if (mountedRef.current) setSiteHealth(newHealth);
        // Update cache
        localStorage.setItem('wp-site-health', JSON.stringify(newHealth));
        localStorage.setItem('wp-site-health-time', Date.now().toString());
      } else {
        toast.error(data.error || "Connection failed");
        const newHealth = { ...siteHealth, [siteId]: false };
        if (mountedRef.current) setSiteHealth(newHealth);
        localStorage.setItem('wp-site-health', JSON.stringify(newHealth));
        localStorage.setItem('wp-site-health-time', Date.now().toString());
      }
    } catch (err) {
      toast.error("Failed to check connection");
    } finally {
      if (mountedRef.current) setIsCheckingHealth(false);
    }
  };

  const previewMarkdown = React.useMemo(() => {
    // Title is rendered separately in the preview modal.
    // If the draft starts with an H1, strip it to avoid duplicate titles.
    return content.replace(/^# .*\n+/, "");
  }, [content]);

  const handlePublish = async () => {
    if (!selectedSiteId) {
      setError("Please select a WordPress site");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      
      const publishData: any = {
        articleId,
        wordPressSiteId: selectedSiteId,
        title,
        content,
        status,
        categories: categories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (featuredImageUrl) {
        publishData.featuredImageUrl = featuredImageUrl;
      }

      if (status === 'future' && scheduledDate) {
        publishData.scheduledDate = new Date(scheduledDate).toISOString();
      }

      const response = await fetch("/api/wordpress/publish", {
        method: "POST",
        headers,
        body: JSON.stringify(publishData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish");
      }

      // Log to history
      await fetch("/api/wordpress/history", {
        method: "POST",
        headers,
        body: JSON.stringify({
          articleId,
          siteId: selectedSiteId,
          postId: data.postId,
          postUrl: data.postUrl,
          status: 'success',
          retryCount: data.retryCount || 0,
        }),
      });

      const statusText = status === 'future' ? 'scheduled' : status;
      toast.success(`Article ${statusText} on WordPress`);
      onPublishSuccess?.(data.postUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to publish article";
      setError(errorMessage);
      toast.error(errorMessage);

      // Log failed attempt
      try {
        const headers = await getAuthHeaders();
        await fetch("/api/wordpress/history", {
          method: "POST",
          headers,
          body: JSON.stringify({
            articleId,
            siteId: selectedSiteId,
            status: 'failed',
            error: errorMessage,
          }),
        });
      } catch {}
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSiteId || !publishedPostId) {
      setError("Cannot update: missing site or post ID");
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch("/api/wordpress/update", {
        method: "POST",
        headers,
        body: JSON.stringify({
          articleId,
          siteId: selectedSiteId,
          postId: publishedPostId,
          title,
          content,
          status,
          categories: categories
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          featuredImageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update");
      }

      toast.success("Article updated on WordPress");
      onPublishSuccess?.(data.postUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update article";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (sites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs sm:text-sm font-medium">
            WordPress Publishing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              No WordPress sites connected. Go to Settings to connect a site.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs sm:text-sm font-medium">
          {publishedPostId ? "Update on WordPress" : "Publish to WordPress"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Published URL */}
        {publishedUrl && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-green-600 dark:text-green-400 flex items-center gap-2 text-xs sm:text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Published
              </span>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-green-600 hover:text-green-700 text-xs h-7 sm:h-8"
              >
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                  View Post
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Site Selection */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">WordPress Site</Label>
          <div className="flex gap-2">
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger className="flex-1 h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id} className="text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{site.siteName}</span>
                      {siteHealth[site.id] === true && (
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      )}
                      {siteHealth[site.id] === false && (
                        <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSiteId && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => checkSiteHealth(selectedSiteId)}
                disabled={isCheckingHealth}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Publish Status</Label>
          <Select
            value={status}
            onValueChange={(value: any) => setStatus(value)}
          >
            <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft" className="text-xs sm:text-sm">Draft</SelectItem>
              <SelectItem value="pending" className="text-xs sm:text-sm">Pending Review</SelectItem>
              <SelectItem value="publish" className="text-xs sm:text-sm">Publish Now</SelectItem>
              <SelectItem value="future" className="text-xs sm:text-sm">Schedule for Later</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scheduled Date */}
        {status === 'future' && (
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Schedule Date & Time</Label>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Article will be published automatically at this time
            </p>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Categories (comma-separated)</Label>
          <Input
            placeholder="Technology, AI, Writing"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            className="h-9 sm:h-10 text-xs sm:text-sm"
          />
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Categories will be created if they don't exist
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Tags (comma-separated)</Label>
          <Input
            placeholder="ai, content, automation"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="h-9 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        {/* Featured Image */}
        {featuredImageUrl && (
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Featured Image</Label>
            <div className="flex items-center gap-2 p-2 border rounded-lg">
              <img 
                src={featuredImageUrl} 
                alt="Featured" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded shrink-0"
              />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Will be uploaded to WordPress</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowPreview(true)}
            disabled={!selectedSiteId}
            variant="outline"
            className="h-9 sm:h-10 text-xs sm:text-sm"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span>Preview</span>
          </Button>
          
          {publishedPostId ? (
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || !selectedSiteId}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span>Update Post</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={isPublishing || !selectedSiteId || (status === 'future' && !scheduledDate)}
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  {status === 'future' ? (
                    <>
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span>Schedule Post</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span>Publish to WordPress</span>
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto" onClick={() => setShowPreview(false)}>
          <div className="w-full max-w-4xl rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6 my-4 sm:my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <h3 className="text-base sm:text-lg font-bold">WordPress Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-xl sm:text-2xl text-muted-foreground hover:text-foreground">×</button>
            </div>
            
            {/* Featured Image */}
            {featuredImageUrl && (
              <div className="mb-6">
                <img src={featuredImageUrl} alt="Featured" className="w-full h-64 sm:h-96 object-cover rounded-lg" />
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{title}</h1>
            
            {/* Meta */}
            <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b">
              {categories && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Categories:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.split(',').map((cat, i) => (
                      <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{cat.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {tags && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.split(',').map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs">#{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Content */}
            <article
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none 
                prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-12 prose-h3:text-xl 
                prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base
                prose-ul:my-6 prose-ul:space-y-2 prose-ol:my-6 prose-ol:space-y-2 
                prose-li:my-2 prose-li:leading-relaxed
                prose-img:rounded-lg prose-img:my-8 prose-img:shadow-lg
                prose-strong:font-semibold prose-strong:text-foreground
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                [&>*:first-child]:mt-0"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {previewMarkdown}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      )}
    </Card>
  );
}
