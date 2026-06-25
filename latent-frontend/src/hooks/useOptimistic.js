import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Helper hook for optimistic updates on TanStack Query.
 * Usage:
 *   const { optimisticUpdate } = useOptimistic();
 *   await optimisticUpdate(queryKey, updater, mutation);
 */
export function useOptimistic() {
  const qc = useQueryClient();
  const prevData = useRef(null);

  const optimisticUpdate = useCallback(async (queryKey, updater, mutationFn) => {
    await qc.cancelQueries({ queryKey });
    prevData.current = qc.getQueryData(queryKey);
    qc.setQueryData(queryKey, updater);

    try {
      const result = await mutationFn();
      return result;
    } catch (err) {
      qc.setQueryData(queryKey, prevData.current);
      throw err;
    } finally {
      qc.invalidateQueries({ queryKey });
    }
  }, [qc]);

  return { optimisticUpdate };
}
