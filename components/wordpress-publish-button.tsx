"use client";

import { useState } from "react";
import { Globe, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/hooks/use-auth";

interface WordPressPublishButtonProps {
  articleId: string;
  wordPressSites: Array<{
    id: string;
    siteName: string;
    siteUrl: string;
  }>;
  onPublished?: (postUrl: string) => void;
}

export function WordPressPublishButton({
  articleId,
  wordPressSites,
  onPublished,
}: WordPressPublishButtonProps) {
  const [publishing, setPublishing] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [showDialog, setShowDialog] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  async function handlePublish() {
    if (!selectedSite) {
      toast.error("Please select a WordPress site");
      return;
    }

    setPublishing(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/wordpress/publish", {
        method: "POST",
        headers,
        body: JSON.stringify({
          articleId,
          wordPressSiteId: selectedSite,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to publish");
      }

      const data = await response.json();
      setPublishedUrl(data.postUrl);
      toast.success("Published to WordPress!");
      onPublished?.(data.postUrl);
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish to WordPress");
    } finally {
      setPublishing(false);
    }
  }

  if (wordPressSites.length === 0) {
    return (
      <button
        onClick={() => window.location.href = "/dashboard/settings"}
        className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "var(--surface-1)",
          color: "var(--text-2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(155,141,255,0.3)";
          e.currentTarget.style.color = "var(--lilac)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = "var(--text-2)";
        }}
      >
        <Globe className="h-4 w-4" />
        Connect WordPress
      </button>
    );
  }

  if (publishedUrl) {
    return (
      <a
        href={publishedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
        style={{
          borderColor: "rgba(0,217,180,0.3)",
          background: "rgba(0,217,180,0.1)",
          color: "var(--teal)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,217,180,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,217,180,0.3)";
        }}
      >
        <CheckCircle2 className="h-4 w-4" />
        View on WordPress
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        disabled={publishing}
        className="btn-gold"
      >
        {publishing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            <Globe className="h-4 w-4" />
            Publish to WordPress
          </>
        )}
      </button>

      {/* Site Selection Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="rounded-2xl border p-6 w-full max-w-md card-premium"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "var(--surface-1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="font-display text-xl font-bold mb-4"
              style={{ color: "var(--text-1)" }}
            >
              Select WordPress Site
            </h3>

            <div className="space-y-2 mb-6">
              {wordPressSites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSite(site.id)}
                  className="w-full p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor:
                      selectedSite === site.id
                        ? "rgba(245,166,35,0.3)"
                        : "rgba(255,255,255,0.06)",
                    background:
                      selectedSite === site.id
                        ? "rgba(245,166,35,0.08)"
                        : "var(--surface-2)",
                  }}
                >
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--text-1)" }}
                  >
                    {site.siteName}
                  </p>
                  <p
                    className="font-mono-dm text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    {site.siteUrl}
                  </p>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-all"
                style={{
                  borderColor: "rgba(255,255,255,0.06)",
                  background: "var(--surface-2)",
                  color: "var(--text-2)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDialog(false);
                  handlePublish();
                }}
                disabled={!selectedSite}
                className="btn-gold flex-1"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
