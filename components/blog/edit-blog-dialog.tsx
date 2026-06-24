"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  description: string;
  slug: string;
  tags: string[];
  coverImage?: string;
}

interface EditBlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost;
  onUpdated: (post: BlogPost) => void;
}

export function EditBlogDialog({
  open,
  onOpenChange,
  post,
  onUpdated,
}: EditBlogDialogProps) {
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description);
  const [tags, setTags] = useState(post.tags.join(", "));
  const [featuredImage, setFeaturedImage] = useState(post.coverImage || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: post.id,
          title,
          description,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          featuredImage: featuredImage || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      onUpdated({
        ...post,
        title,
        description,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        coverImage: featuredImage,
      });
      toast.success("Blog post updated!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Blog Post</DialogTitle>
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

          {/* Slug (read-only) */}
          <div>
            <Label htmlFor="slug">Slug (cannot be changed)</Label>
            <Input
              id="slug"
              value={post.slug}
              disabled
              className="mt-1.5 font-mono text-sm opacity-60"
            />
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

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
