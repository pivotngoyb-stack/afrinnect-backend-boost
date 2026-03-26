// @ts-nocheck
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function GoogleAnalytics({ gaId: propGaId }: { gaId?: string }) {
  const location = useLocation();
  const [gaId, setGaId] = useState(propGaId || null);

  useEffect(() => {
    if (!gaId) return;
    if (typeof window !== 'undefined' && !(window as any).gtag) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);
    }
  }, [gaId]);

  useEffect(() => {
    if ((window as any).gtag && gaId) {
      (window as any).gtag('config', gaId, { page_path: location.pathname + location.search });
    }
  }, [location, gaId]);

  return null;
}

export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }
};
