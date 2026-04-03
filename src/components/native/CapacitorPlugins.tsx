// @ts-nocheck
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

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
    if (!Capacitor.isNativePlatform()) return;

    // Hide splash screen after app is ready
    SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});

    // Configure status bar
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    if (Capacitor.getPlatform() === 'android') {
      StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
    }
  }, []);

  // Android hardware back button
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('backButton', ({ canGoBack }) => {
      // If on a root tab, minimize the app instead of going back
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

    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, location.pathname]);

  return null;
}
