import React, { createContext, useContext, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useBreadcrumbs, getBreadcrumbs, addBreadcrumb } from "./BreadcrumbTracker";
import { useLocation } from "react-router-dom";

interface ErrorLoggerContextType {
  captureError: (error: Error, errorInfo?: Record<string, unknown>) => Promise<void>;
  addBreadcrumb: typeof addBreadcrumb;
}

const ErrorLoggerContext = createContext<ErrorLoggerContextType | undefined>(undefined);

export function ErrorLoggerProvider({ children }: { children: React.ReactNode }) {
  useBreadcrumbs();
  const location = useLocation();

  useEffect(() => {
    addBreadcrumb("navigation", `Navigated to ${location.pathname}`);
  }, [location]);

  const captureError = useCallback(async (error: Error, errorInfo: Record<string, unknown> = {}) => {
    try {
      const breadcrumbs = getBreadcrumbs();

      const payload = {
        message: error.message || String(error),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: errorInfo.type || "error",
        url: window.location.href,
        browser: navigator.userAgent,
        device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
        breadcrumbs,
        severity: errorInfo.severity || "medium",
      };

      console.error("[ErrorLogger]", payload);

      // TODO: Replace with Supabase edge function call
      // await supabase.functions.invoke('log-client-error', { body: payload });

      if (payload.severity === "critical") {
        toast.error("Something went wrong", {
          description: "Our team has been notified.",
        });
      }
    } catch (loggingError) {
      console.error("Failed to send error log:", loggingError);
    }
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      captureError(event.error || new Error(event.message), {
        type: "runtime_error",
        severity: "high",
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      captureError(event.reason || new Error("Unhandled Rejection"), {
        type: "unhandled_rejection",
        severity: "medium",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [captureError]);

  return (
    <ErrorLoggerContext.Provider value={{ captureError, addBreadcrumb }}>
      {children}
    </ErrorLoggerContext.Provider>
  );
}

export const useErrorLogger = () => {
  const context = useContext(ErrorLoggerContext);
  if (!context) throw new Error("useErrorLogger must be used within ErrorLoggerProvider");
  return context;
};
