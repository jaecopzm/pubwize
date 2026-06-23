"use client";

import { useState, useEffect } from "react";
import { searchUnsplashImages, triggerUnsplashDownload, getUnsplashMarkdown, type UnsplashImage } from "@/lib/unsplash";
import { Image as ImageIcon, Loader2, Download, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageSelectorProps {
  keyword: string;
  onImageSelect: (markdown: string) => void;
}

export function ImageSelector({ keyword, onImageSelect }: ImageSelectorProps) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [keyword]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const results = await searchUnsplashImages(keyword, 6);
      setImages(results);
    } catch (error) {
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (image: UnsplashImage) => {
    setSelectedId(image.id);
    
    // Trigger download tracking (required by Unsplash)
    await triggerUnsplashDownload(image.links.download_location);
    
    // Insert markdown
    const altText = (image.alt_description || image.description || "Image")
      .replace(/^./, c => c.toUpperCase());
    const markdown = getUnsplashMarkdown(image, altText);
    onImageSelect(markdown);
    
    toast.success("Image added to content");
    
    setTimeout(() => setSelectedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/50 p-6 text-center">
        <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No images found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {images.map((image) => (
        <button
          key={image.id}
          onClick={() => handleSelect(image)}
          className={cn(
            "group relative aspect-video overflow-hidden rounded-lg border transition-all",
            selectedId === image.id
              ? "border-green-500/50 ring-2 ring-green-500/30"
              : "border-border/60 hover:border-violet-500/40 hover:shadow-lg"
          )}
        >
          <img
            src={image.urls.small}
            alt={image.alt_description || ""}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[10px] text-white/90 truncate">
                by {image.user.name}
              </p>
            </div>
          </div>

          {/* Selected indicator */}
          {selectedId === image.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
              <div className="rounded-full bg-green-500 p-2">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
          )}

          {/* Insert icon */}
          {selectedId !== image.id && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="rounded-full bg-violet-600 p-1.5 shadow-lg">
                <Download className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
