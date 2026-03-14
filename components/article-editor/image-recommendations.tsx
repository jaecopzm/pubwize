"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { getFirebaseAuth } from "@/lib/firebase-client";

interface ImageRecommendation {
  section: string;
  query: string;
  reason: string;
}

interface ImageRecommendationsProps {
  content: string;
  keyword: string;
  onImageSelect: (query: string, section: string) => void;
}

export function ImageRecommendations({
  content,
  keyword,
  onImageSelect,
}: ImageRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ImageRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Not authenticated");

      const response = await fetch('/api/articles/image-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ content, keyword }),
      });

      if (!response.ok) throw new Error('Failed to get recommendations');

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      toast.error('Failed to generate image recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (content && content.length > 500) {
      generateRecommendations();
    }
  }, [content, keyword]);

  const handleAddImage = (section: string, query: string) => {
    setSelectedSection(section);
    onImageSelect(query, section);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 sm:p-4">
        <div className="flex items-center justify-center gap-2 text-text-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Analyzing content for image opportunities...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gold/20 bg-gold/5 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="h-4 w-4 text-gold" />
        <h3 className="text-xs sm:text-sm font-semibold font-mono-dm text-text-1">
          Image Recommendations
        </h3>
      </div>
      <p className="text-[10px] sm:text-xs text-text-3 mb-3">
        Add images to these sections to improve engagement
      </p>
      <div className="space-y-2">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="group flex items-start justify-between gap-2 rounded-lg border border-gold/20 bg-gold/5 p-2.5 transition-all hover:bg-gold/10"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs font-semibold text-text-1 mb-0.5 truncate">
                {rec.section}
              </div>
              <div className="text-[9px] sm:text-[10px] text-text-3 mb-1">
                {rec.reason}
              </div>
              <div className="text-[9px] sm:text-[10px] font-mono-dm text-gold">
                Search: "{rec.query}"
              </div>
            </div>
            <button
              onClick={() => handleAddImage(rec.section, rec.query)}
              className="group/btn relative shrink-0 flex items-center gap-1 rounded-lg border border-gold/30 bg-gold/5 px-2 py-1 text-[10px] font-semibold text-gold transition-all hover:bg-gold/10 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
              <Plus className="h-3 w-3 relative z-10 group-hover/btn:rotate-90 transition-transform" />
              <span className="relative z-10 hidden sm:inline">Add</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
