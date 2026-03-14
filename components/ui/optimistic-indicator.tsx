/**
 * Optimistic Update Indicator
 * Shows visual feedback for optimistic updates
 */

import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimisticIndicatorProps {
  isOptimistic: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  className?: string;
}

export function OptimisticIndicator({
  isOptimistic,
  isLoading = false,
  hasError = false,
  className,
}: OptimisticIndicatorProps) {
  if (!isOptimistic && !isLoading && !hasError) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium transition-all',
        hasError && 'text-red-500',
        isLoading && 'text-[var(--text-3)]',
        isOptimistic && !isLoading && !hasError && 'text-[var(--gold)]',
        className
      )}
    >
      {hasError && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Failed to save</span>
        </>
      )}
      
      {isLoading && !hasError && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      
      {isOptimistic && !isLoading && !hasError && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
    </div>
  );
}

/**
 * Auto-save Status Indicator
 */
interface AutoSaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  className?: string;
}

export function AutoSaveStatus({
  isSaving,
  lastSaved,
  hasUnsavedChanges,
  className,
}: AutoSaveStatusProps) {
  const getStatusText = () => {
    if (isSaving) return 'Saving...';
    if (hasUnsavedChanges) return 'Unsaved changes';
    if (!lastSaved) return 'Not saved';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (seconds < 10) return 'Saved just now';
    if (seconds < 60) return `Saved ${seconds}s ago`;
    if (minutes < 60) return `Saved ${minutes}m ago`;
    
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  };

  const getStatusIcon = () => {
    if (isSaving) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (hasUnsavedChanges) return <AlertCircle className="h-3 w-3" />;
    return <Check className="h-3 w-3" />;
  };

  const getStatusColor = () => {
    if (isSaving) return 'text-[var(--text-3)]';
    if (hasUnsavedChanges) return 'text-yellow-500';
    return 'text-[var(--gold)]';
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium transition-all',
        getStatusColor(),
        className
      )}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}

/**
 * Optimistic List Item Wrapper
 * Adds visual feedback for optimistic list items
 */
interface OptimisticListItemProps {
  isOptimistic: boolean;
  children: React.ReactNode;
  className?: string;
}

export function OptimisticListItem({
  isOptimistic,
  children,
  className,
}: OptimisticListItemProps) {
  return (
    <div
      className={cn(
        'transition-all duration-300',
        isOptimistic && 'opacity-60 scale-[0.98]',
        className
      )}
    >
      {children}
      {isOptimistic && (
        <div className="absolute top-2 right-2">
          <Loader2 className="h-3 w-3 animate-spin text-[var(--gold)]" />
        </div>
      )}
    </div>
  );
}
