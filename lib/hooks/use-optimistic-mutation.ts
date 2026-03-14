/**
 * Optimistic Mutation Hook
 * Provides instant UI feedback before server confirmation
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface OptimisticMutationOptions<T, R> {
  mutationFn: (data: T) => Promise<R>;
  onSuccess?: (result: R, data: T) => void;
  onError?: (error: Error, data: T) => void;
  successMessage?: string;
  errorMessage?: string;
  optimisticUpdate?: (data: T) => void;
  rollback?: () => void;
}

interface OptimisticMutationResult<T> {
  mutate: (data: T) => Promise<void>;
  isLoading: boolean;
  isOptimistic: boolean;
}

/**
 * Hook for optimistic mutations with automatic rollback on error
 */
export function useOptimisticMutation<T, R = any>(
  options: OptimisticMutationOptions<T, R>
): OptimisticMutationResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const mutate = useCallback(
    async (data: T) => {
      try {
        setIsLoading(true);
        setIsOptimistic(true);

        // Apply optimistic update immediately
        if (options.optimisticUpdate) {
          options.optimisticUpdate(data);
        }

        // Perform actual mutation
        const result = await options.mutationFn(data);

        // Success
        setIsOptimistic(false);
        
        if (options.successMessage) {
          toast.success(options.successMessage);
        }

        if (options.onSuccess) {
          options.onSuccess(result, data);
        }
      } catch (error) {
        // Rollback optimistic update
        setIsOptimistic(false);
        
        if (options.rollback) {
          options.rollback();
        }

        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        toast.error(options.errorMessage || errorMessage);

        if (options.onError) {
          options.onError(error as Error, data);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  return {
    mutate,
    isLoading,
    isOptimistic,
  };
}

/**
 * Hook for optimistic list updates (add/remove/update items)
 */
export function useOptimisticList<T extends { id: string }>(initialData: T[]) {
  const [data, setData] = useState<T[]>(initialData);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const addOptimistic = useCallback((item: T) => {
    setData((prev) => [item, ...prev]);
    setOptimisticIds((prev) => new Set(prev).add(item.id));
  }, []);

  const removeOptimistic = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const updateOptimistic = useCallback((id: string, updates: Partial<T>) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    setOptimisticIds((prev) => new Set(prev).add(id));
  }, []);

  const confirmOptimistic = useCallback((id: string, confirmedData?: Partial<T>) => {
    if (confirmedData) {
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...confirmedData } : item))
      );
    }
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const rollbackOptimistic = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const resetData = useCallback((newData: T[]) => {
    setData(newData);
    setOptimisticIds(new Set());
  }, []);

  return {
    data,
    optimisticIds,
    addOptimistic,
    removeOptimistic,
    updateOptimistic,
    confirmOptimistic,
    rollbackOptimistic,
    resetData,
    isOptimistic: (id: string) => optimisticIds.has(id),
  };
}
