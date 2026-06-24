"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { calculateSEOScore, getScoreColor } from "@/lib/seo-scoring";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  initialTitle: string;
  initialDescription: string;
  initialKeyword: string;
  initialImage?: string;
  draftContent?: string;
  onPublished?: (slug: string) => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  articleId,
  initialTitle,
  initialDescription,
  initialKeyword,
  initialImage,
  draftContent,
  onPublished,
}: PublishDialogProps) {
  const [title, setTitle] = useState(initialTitle || initialKeyword);
  const [description, setDescription] = useState(initialDescription);
  const [slug, setSlug] = useState(
    initialKeyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  );
  const [tags, setTags] = useState("");
  const [featuredImage, setFeaturedImage] = useState(initialImage || "");
  const [publishing, setPublishing] = useState(false);

  const seoScore = useMemo(() => {
    if (!draftContent || !initialKeyword) return null;
    try { return calculateSEOScore(draftContent, initialKeyword); } catch { return null; }
  }, [draftContent, initialKeyword]);

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch("/api/admin/blog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          title,
          description,
          slug,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          featuredImage: featuredImage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to publish");
      }

      const data = await res.json();
      toast.success("Published to blog!");
      onPublished?.(data.slug);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish to Blog</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title"
              className="mt-1.5"
            />
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="article-slug"
              className="mt-1.5 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL: pubwize.com/blog/{slug || "article-slug"}
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for SEO and previews"
              rows={3}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/160 characters
            </p>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="seo, content-marketing, ai"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated list
            </p>
          </div>

          {/* Featured Image */}
          <div>
            <Label>Featured Image</Label>
            <Input
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter image URL or leave blank
            </p>
          </div>

          {/* Preview */}
          {(title || description || featuredImage) && (
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Preview</p>
              <div className="space-y-2">
                {featuredImage && (
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
                <h3 className="font-bold text-lg line-clamp-2">{title || "Article Title"}</h3>
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
                )}
              </div>
            </div>
          )}

          {/* SEO Score */}
          {seoScore && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">SEO Score</span>
              <span className={`ml-auto text-lg font-black ${getScoreColor(seoScore.overall)}`}>
                {seoScore.overall}
                <span className="text-xs font-normal text-muted-foreground">/100</span>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={publishing}
            >
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Publish to Blog
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
