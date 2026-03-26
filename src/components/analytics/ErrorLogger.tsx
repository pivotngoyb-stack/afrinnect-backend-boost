// @ts-nocheck
import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBreadcrumbs, getBreadcrumbs, addBreadcrumb } from './BreadcrumbTracker';
import { useLocation } from 'react-router-dom';

const ErrorLoggerContext = createContext<any>(null);

export function ErrorLoggerProvider({ children }) {
  useBreadcrumbs();
  const location = useLocation();

  useEffect(() => {
    addBreadcrumb('navigation', `Navigated to ${location.pathname}`);
  }, [location]);

  const captureError = async (error: any, errorInfo: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const breadcrumbs = getBreadcrumbs();

      const payload = {
        message: error.message || String(error),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: errorInfo.type || 'error',
        url: window.location.href,
        userId: user?.id,
        userEmail: user?.email,
        browser: navigator.userAgent,
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        breadcrumbs,
        severity: errorInfo.severity || 'medium'
      };

      console.error('[ErrorLogger]', payload);

      if (payload.severity === 'critical') {
        toast.error('Something went wrong', { description: 'Our team has been notified.' });
      }
    } catch (loggingError) {
      console.error('Failed to send error log:', loggingError);
    }
  };

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureError(event.error || new Error(event.message), { type: 'runtime_error', severity: 'high' });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      captureError(event.reason || new Error('Unhandled Rejection'), { type: 'unhandled_rejection', severity: 'medium' });
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => { window.removeEventListener('error', handleError); window.removeEventListener('unhandledrejection', handleRejection); };
  }, []);

  return (
    <ErrorLoggerContext.Provider value={{ captureError, addBreadcrumb }}>
      {children}
    </ErrorLoggerContext.Provider>
  );
}

export const useErrorLogger = () => useContext(ErrorLoggerContext);
