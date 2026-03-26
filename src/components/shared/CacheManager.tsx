// @ts-nocheck
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useCacheWarmer() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let idleTimeout;

    const prefetchData = () => {
      queryClient.prefetchQuery({
        queryKey: ['prefetch-profiles'],
        queryFn: async () => [],
        staleTime: 60000
      });
    };

    const handleActivity = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(prefetchData, 3000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(idleTimeout);
    };
  }, [queryClient]);
}

export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnlineReconnect = () => {
      queryClient.invalidateQueries();
    };

    window.addEventListener('online-reconnect', handleOnlineReconnect);
    return () => window.removeEventListener('online-reconnect', handleOnlineReconnect);
  }, [queryClient]);
}

export const cacheConfig = {
  realtime: { staleTime: 5000, cacheTime: 30000 },
  dynamic: { staleTime: 30000, cacheTime: 300000 },
  static: { staleTime: 300000, cacheTime: 3600000 }
};
