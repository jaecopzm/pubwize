"use client";

import { useState, useEffect } from 'react';
import { Clock, History, User, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getFirebaseAuth } from '@/lib/firebase-client';
import type { VersionSnapshot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VersionHistoryPanelProps {
  articleId: string;
  onSelectVersion?: (snapshot: VersionSnapshot) => void;
  onRestoreVersion?: (snapshotId: string) => void;
}

export function VersionHistoryPanel({
  articleId,
  onSelectVersion,
  onRestoreVersion,
}: VersionHistoryPanelProps) {
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    fetchSnapshots();
  }, [articleId]);

  async function fetchSnapshots() {
    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`/api/articles/${articleId}/versions`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch version history');
      }

      const data = await response.json();
      setSnapshots(data.snapshots || []);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(snapshotId: string) {
    if (!confirm('Are you sure you want to restore this version? A backup of the current state will be created.')) {
      return;
    }

    try {
      setRestoringId(snapshotId);
      const auth = getFirebaseAuth();
      const idToken = await auth.currentUser?.getIdToken();
      
      if (!idToken) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(
        `/api/articles/${articleId}/versions/${snapshotId}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      toast.success('Version restored successfully');
      
      // Refresh snapshots and notify parent
      await fetchSnapshots();
      if (onRestoreVersion) {
        onRestoreVersion(snapshotId);
      }
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      toast.error('Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  }

  function handleSelectSnapshot(snapshot: VersionSnapshot) {
    setSelectedSnapshotId(snapshot.id);
    if (onSelectVersion) {
      onSelectVersion(snapshot);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Version History</h3>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="p-8 text-center">
        <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No version history yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Versions are created automatically when you make changes
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-violet-400" />
          <h3 className="text-lg font-semibold">Version History</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {snapshots.length} {snapshots.length === 1 ? 'version' : 'versions'}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {snapshots.map((snapshot, index) => {
            const isSelected = selectedSnapshotId === snapshot.id;
            const isRestoring = restoringId === snapshot.id;
            const snapshotDate = new Date(snapshot.timestamp.seconds * 1000);

            return (
              <div
                key={snapshot.id}
                className={cn(
                  "group relative rounded-lg border p-4 transition-all cursor-pointer",
                  isSelected
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-border hover:border-violet-500/40 hover:bg-violet-500/5"
                )}
                onClick={() => handleSelectSnapshot(snapshot)}
              >
                {index === 0 && (
                  <div className="absolute -top-2 left-4 px-2 py-0.5 bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                    Latest
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {snapshot.changeDescription}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(snapshotDate, { addSuffix: true })}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="capitalize">{snapshot.contentType}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(snapshot.id);
                    }}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <span className="flex items-center gap-1">
                        <RotateCcw className="h-3 w-3 animate-spin" />
                        <span className="text-xs">Restoring...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        <span className="text-xs">Restore</span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
