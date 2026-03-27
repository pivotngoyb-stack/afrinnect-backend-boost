import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function useOptimisticUpdate(queryKey: string[], mutationFn: (variables: any) => Promise<any>) {
  const queryClient = useQueryClient();
  const [optimisticData, setOptimisticData] = useState<any>(null);

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables: any) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      if (variables.optimisticUpdate) {
        queryClient.setQueryData(queryKey, variables.optimisticUpdate);
        setOptimisticData(variables.optimisticUpdate);
      }
      return { previousData };
    },
    onError: (_err: any, _variables: any, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      setOptimisticData(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      setOptimisticData(null);
    }
  });

  return { ...mutation, optimisticData };
}
