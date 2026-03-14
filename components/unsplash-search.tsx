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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="search-glow-wrapper">
        <div className="search-glow" />
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            searchImages(query);
          }}
          className="relative z-10"
        >
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                type="text"
                placeholder="Search free images on Unsplash..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border"
                style={{ 
                  borderColor: 'rgba(255,255,255,0.06)', 
                  background: 'var(--surface-1)',
                  color: 'var(--text-1)'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-gold px-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
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
              className="group relative rounded-xl overflow-hidden cursor-pointer card-premium"
              style={{
                aspectRatio: '4/3',
                borderColor: selectedImage === image.id ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.06)'
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
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
              >
                <p className="text-xs font-semibold text-white truncate">
                  {image.user.name}
                </p>
                <a
                  href={`https://unsplash.com/@${image.user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-white/70 hover:text-white flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  View on Unsplash <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Selected Indicator */}
              {selectedImage === image.id && (
                <div 
                  className="absolute top-2 right-2 rounded-full p-1.5"
                  style={{ background: 'var(--gold)' }}
                >
                  <Download className="h-3 w-3" style={{ color: '#0a0700' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Attribution Notice */}
      {images.length > 0 && (
        <p className="font-mono-dm text-xs text-center" style={{ color: 'var(--text-3)' }}>
          Images provided by{' '}
          <a 
            href="https://unsplash.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--gold)' }}
          >
            Unsplash
          </a>
        </p>
      )}
    </div>
  );
}
