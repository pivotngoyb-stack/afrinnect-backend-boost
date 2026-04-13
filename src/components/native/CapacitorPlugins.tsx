// @ts-nocheck
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Handles native Capacitor plugins:
 * - Splash screen auto-hide
 * - Android hardware back button navigation
 * - Status bar styling
 */
export default function CapacitorPlugins() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cleanup = () => {};

    const init = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
          import('@capacitor/splash-screen'),
          import('@capacitor/status-bar'),
        ]);

        // Hide splash screen after app is ready
        SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

        // Configure status bar
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        if (Capacitor.getPlatform() === 'android') {
          StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
        }
      } catch {
        // Capacitor not available — running in browser
      }
    };

    init();
    return () => cleanup();
  }, []);

  // Android hardware back button
  useEffect(() => {
    let listenerPromise: any = null;

    const setupBackButton = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');

        listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
          const rootPaths = ['/home', '/matches', '/communities', '/events', '/profile'];
          if (rootPaths.includes(location.pathname)) {
            App.minimizeApp();
            return;
          }
          if (canGoBack) {
            navigate(-1);
          } else {
            App.minimizeApp();
          }
        });
      } catch {
        // Capacitor not available
      }
    };

    setupBackButton();

    return () => {
      if (listenerPromise) {
        listenerPromise.then((l: any) => l.remove()).catch(() => {});
      }
    };
  }, [navigate, location.pathname]);

  return null;
}
