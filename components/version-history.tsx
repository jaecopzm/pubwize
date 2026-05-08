"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Version {
  id: string;
  content: string;
  status: string;
  createdAt: { _seconds: number };
}

interface VersionHistoryProps {
  articleId: string;
  onRestore: (content: string) => void;
}

export function VersionHistory({ articleId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    try {

      const res = await fetch(`/api/articles/versions?articleId=${articleId}`, {});

      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
      }
    } catch (error) {
      toast.error("Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      fetchVersions();
    }
  }, [showModal]);

  const handleRestore = (version: Version) => {
    onRestore(version.content);
    setShowModal(false);
    toast.success("Version restored");
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-card/80 text-sm transition-all"
      >
        <History className="h-4 w-4" />
        <span className="hidden sm:inline">History</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-bold">Version History</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No version history yet</p>
                <p className="text-xs mt-1">Versions are saved automatically</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal/10 text-teal">
                          {version.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.createdAt._seconds * 1000), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {version.content.substring(0, 100)}...
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestore(version)}
                      className="ml-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 text-xs font-medium transition-all"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
