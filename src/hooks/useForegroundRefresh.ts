import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Refetches critical queries when the app returns to the foreground
 * after being backgrounded for more than 30 seconds.
 * Prevents stale matches, messages, and subscription state.
 */
export function useForegroundRefresh(queryKeys: string[][] = []) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let hiddenAt: number | null = null;
    const STALE_THRESHOLD = 30_000; // 30 seconds

    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > STALE_THRESHOLD) {
        // App was backgrounded long enough — refetch critical data
        if (queryKeys.length > 0) {
          queryKeys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        } else {
          // Default: refetch all active queries
          queryClient.invalidateQueries();
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [queryClient, queryKeys]);
}
