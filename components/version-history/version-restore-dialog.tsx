"use client";

import { useState } from 'react';
import { AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { VersionSnapshot } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface VersionRestoreDialogProps {
  snapshot: VersionSnapshot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function VersionRestoreDialog({
  snapshot,
  open,
  onOpenChange,
  onConfirm,
}: VersionRestoreDialogProps) {
  const [isRestoring, setIsRestoring] = useState(false);

  async function handleConfirm() {
    try {
      setIsRestoring(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error restoring version:', error);
    } finally {
      setIsRestoring(false);
    }
  }

  if (!snapshot) return null;

  const snapshotDate = new Date(snapshot.timestamp.seconds * 1000);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <AlertDialogTitle>Restore Previous Version?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground mb-2">
                {snapshot.changeDescription}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Created {formatDistanceToNow(snapshotDate, { addSuffix: true })}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="capitalize">{snapshot.contentType}</span> content
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                This will restore your article to this previous version. Your current work will be preserved:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>A backup snapshot of your current state will be created automatically</li>
                <li>You can restore back to the current version at any time</li>
                <li>All version history will be preserved</li>
              </ul>
            </div>

            <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3">
              <p className="text-xs text-violet-400 font-medium">
                💡 Tip: You can always undo this action by restoring to the backup version that will be created.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRestoring}>
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isRestoring}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isRestoring ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore Version
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
