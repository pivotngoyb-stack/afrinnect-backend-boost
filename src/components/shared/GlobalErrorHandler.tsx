// @ts-nocheck
import { useEffect } from 'react';
import { toast } from 'sonner';

export function GlobalErrorHandler() {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (response.status === 429) {
          toast.error('Too many requests', { description: 'Please wait a moment and try again' });
        }
        
        if (response.status === 401) {
          console.warn('Authentication required');
        }
        
        if (response.status >= 500) {
          toast.error('Server error', { description: 'Please try again later' });
        }
        
        return response;
      } catch (error) {
        if (!navigator.onLine) {
          toast.error('No internet connection');
        } else {
          toast.error('Network error', { description: 'Please check your connection' });
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
