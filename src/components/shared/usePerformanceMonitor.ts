// @ts-nocheck
import { useEffect } from 'react';

export function usePerformanceMonitor(pageName: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measurePageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const metrics = {
          page: pageName,
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
          timestamp: new Date().toISOString()
        };
        if (import.meta.env.DEV) {
          console.log('⚡ Performance:', metrics);
        }
      }
    };

    const measureApiCalls = () => {
      const resources = performance.getEntriesByType('resource');
      const apiCalls = resources.filter(r => r.name.includes('/api/') || r.name.includes('supabase'));
      const slowCalls = apiCalls.filter(call => call.duration > 1000);
      if (slowCalls.length > 0 && import.meta.env.DEV) {
        console.warn('🐌 Slow API calls detected:', slowCalls.map(c => ({
          url: c.name,
          duration: `${Math.round(c.duration)}ms`
        })));
      }
    };

    const timeout = setTimeout(() => {
      measurePageLoad();
      measureApiCalls();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [pageName]);
}

export function useRenderMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 50 && import.meta.env.DEV) {
        console.warn(`⏱️ ${componentName} render took ${Math.round(renderTime)}ms`);
      }
    };
  });
}

export function logError(error: Error, errorInfo?: any) {
  if (import.meta.env.DEV) {
    console.error('❌ Error caught:', error, errorInfo);
  }
}
