// @ts-nocheck
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export default function GoogleAnalytics() {
  const location = useLocation();
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    const loadGA = async () => {
      try {
        // TODO: Fetch GA ID from backend edge function
        console.log('[GoogleAnalytics] GA ID loading not yet connected to backend');
      } catch {
        // GA not configured, fail silently
      }
    };
    loadGA();
  }, []);

  useEffect(() => {
    if (window.gtag && gaId) {
      window.gtag('config', gaId, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location, gaId]);

  return null;
}

export const trackEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};
