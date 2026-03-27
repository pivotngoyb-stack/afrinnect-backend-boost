import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

export function useInfinitePagination(tableName: string, filters: Record<string, any> = {}, options: any = {}) {
  const {
    pageSize = 20,
    sortBy = 'created_at',
    sortAsc = false,
    enableRefetch = true,
    refetchInterval = 60000
  } = options;

  // Handle '-column' prefix for descending sort
  const resolvedSortAsc = sortBy.startsWith('-') ? false : sortAsc;
  let resolvedSortBy = sortBy.startsWith('-') ? sortBy.slice(1) : sortBy;
  if (resolvedSortBy === 'created_date') resolvedSortBy = 'created_at';

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: [tableName, filters, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const from = pageParam * pageSize;
        const to = from + pageSize; // fetch one extra to check if more

        let query = supabase
          .from(tableName)
          .select('*')
          .order(resolvedSortBy, { ascending: resolvedSortAsc })
          .range(from, to);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !Array.isArray(value)) {
              Object.entries(value).forEach(([op, val]) => {
                if (op === '$gte') query = query.gte(key, val);
                else if (op === '$lte') query = query.lte(key, val);
                else if (op === '$gt') query = query.gt(key, val);
                else if (op === '$lt') query = query.lt(key, val);
                else if (op === '$ne') query = query.neq(key, val);
              });
            } else if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });

        const { data: results, error: queryError } = await query;
        if (queryError) throw queryError;

        const hasMore = (results?.length || 0) > pageSize;
        const items = hasMore ? results!.slice(0, pageSize) : (results || []);

        return {
          items,
          nextPage: hasMore ? pageParam + 1 : null,
          hasMore
        };
      } catch (err) {
        console.error(`Failed to fetch ${tableName}:`, err);
        return { items: [], nextPage: null, hasMore: false };
      }
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    initialPageParam: 0,
    refetchInterval: enableRefetch ? refetchInterval : false,
    staleTime: options.staleTime || 120000,
    retry: options.retry || 1,
    retryDelay: options.retryDelay || 5000,
    enabled: options.enabled !== false
  });

  const allItems = data?.pages.flatMap((page: any) => page.items) || [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    items: allItems,
    loadMore,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isLoading,
    error,
    refetch
  };
}
