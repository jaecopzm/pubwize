/**
 * Auto-save Hook with Optimistic Updates
 * Automatically saves data with debouncing and optimistic UI
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface AutoSaveOptions<T> {
  data: T;
  saveFn: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

interface AutoSaveResult {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveNow: () => Promise<void>;
}

/**
 * Hook for auto-saving with debouncing and optimistic updates
 */
export function useAutoSave<T>({
  data,
  saveFn,
  delay = 2000,
  enabled = true,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: AutoSaveOptions<T>): AutoSaveResult {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);
  const isMountedRef = useRef(true);

  const save = useCallback(async () => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      setHasUnsavedChanges(false);
      
      if (onSaveStart) {
        onSaveStart();
      }

      await saveFn(data);

      if (isMountedRef.current) {
        setLastSaved(new Date());
        previousDataRef.current = data;
        
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        setHasUnsavedChanges(true);
        
        if (onSaveError) {
          onSaveError(error as Error);
        } else {
          toast.error('Failed to save changes');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [data, enabled, isSaving, saveFn, onSaveStart, onSaveSuccess, onSaveError]);

  // Debounced auto-save
  useEffect(() => {
    if (!enabled) return;

    // Check if data has changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    
    if (hasChanged) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        save();
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (hasUnsavedChanges && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        // Note: This won't work reliably on unmount, but it's a best effort
        saveFn(data).catch(console.error);
      }
    };
  }, [hasUnsavedChanges, data, saveFn]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow: save,
  };
}

/**
 * Format last saved time for display
 */
export function formatLastSaved(lastSaved: Date | null): string {
  if (!lastSaved) return 'Not saved';

  const now = new Date();
  const diff = now.getTime() - lastSaved.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 10) return 'Saved just now';
  if (seconds < 60) return `Saved ${seconds}s ago`;
  if (minutes < 60) return `Saved ${minutes}m ago`;
  if (hours < 24) return `Saved ${hours}h ago`;
  
  return `Saved on ${lastSaved.toLocaleDateString()}`;
}
