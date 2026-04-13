import { useEffect } from 'react';
import { toast } from 'sonner';

export function GlobalErrorHandler() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Skip toast for Supabase auth endpoints — these are handled by auth logic
        const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
        const isAuthRequest = url.includes('/auth/v1/') || url.includes('/rest/v1/');
        
        if (!isAuthRequest) {
          if (response.status === 429) {
            toast.error('Too many requests', { description: 'Please wait a moment and try again' });
          }
          
          if (response.status >= 500) {
            toast.error('Server error', { description: 'Please try again later' });
          }
        }
        
        return response;
      } catch (error) {
        if (!navigator.onLine) {
          toast.error('No internet connection');
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
