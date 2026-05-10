"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
  links: {
    download_location: string;
  };
}

interface UnsplashSearchProps {
  onSelectImage: (imageUrl: string, attribution: string) => void;
  initialQuery?: string;
}

export function UnsplashSearch({ onSelectImage, initialQuery = "" }: UnsplashSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  async function searchImages(searchQuery: string) {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/unsplash/search?query=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setImages(data.results || []);
      
      if (data.results?.length === 0) {
        toast.info('No images found. Try a different search term.');
      }
    } catch (error) {
      console.error('Unsplash search error:', error);
      toast.error('Failed to search images');
    } finally {
      setLoading(false);
    }
  }

  // Auto-search when initialQuery is provided (only once)
  useEffect(() => {
    if (initialQuery && initialQuery.trim() && !hasAutoSearched) {
      searchImages(initialQuery);
      setHasAutoSearched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function handleSelectImage(image: UnsplashImage) {
    const attribution = `Photo by ${image.user.name} on Unsplash`;
    setSelectedImage(image.id);
    onSelectImage(image.urls.regular, attribution);
    toast.success('Image selected');
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            searchImages(query);
          }}
          className="relative"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                placeholder="Search free images on Unsplash..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-white/10 bg-surface-2 text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl bg-gold text-obsidian font-bold text-sm hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gold/20 hover:shadow-gold/30 active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-[1.02] active:scale-95"
              style={{
                aspectRatio: '4/3',
                borderColor: selectedImage === image.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                boxShadow: selectedImage === image.id ? '0 0 0 3px rgba(245,166,35,0.2)' : 'none'
              }}
              onClick={() => handleSelectImage(image)}
            >
              <img
                src={image.urls.small}
                alt={image.alt_description || 'Unsplash image'}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"
              >
                <p className="text-xs font-bold text-white truncate">
                  {image.user.name}
                </p>
                <a
                  href={`https://unsplash.com/@${image.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-white/80 hover:text-white flex items-center gap-1 mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  View on Unsplash <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Selected Indicator */}
              {selectedImage === image.id && (
                <div 
                  className="absolute top-3 right-3 rounded-full p-2 bg-gold shadow-lg"
                >
                  <Download className="h-4 w-4 text-obsidian" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && images.length === 0 && query && (
        <div className="text-center py-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 mb-4">
            <Search className="h-8 w-8 text-text-3" />
          </div>
          <p className="text-sm font-semibold text-text-2">No images found</p>
          <p className="text-xs text-text-3 mt-1">Try a different search term</p>
        </div>
      )}

      {/* Attribution Notice */}
      {images.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-center text-text-3">
            Images provided by{' '}
            <a 
              href="https://unsplash.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold hover:text-gold/80 underline underline-offset-2 font-semibold"
            >
              Unsplash
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
