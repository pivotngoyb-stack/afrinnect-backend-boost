import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export default function PushNotificationSetup({ userProfile }: { userProfile: any }) {
  const [isSetup, setIsSetup] = useState(false);

  const setupPushNotifications = useCallback(async () => {
    if (!userProfile || isSetup) return;

    // Only run on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications: not a native platform, skipping');
      return;
    }

    try {
      // Check current permission status
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token:', token.value);

        // Save token to user profile if different
        if (userProfile.push_token !== token.value) {
          try {
            const { error } = await supabase
              .from('user_profiles')
              .update({ push_token: token.value })
              .eq('user_id', userProfile.user_id);

            if (error) {
              console.warn('Failed to save push token:', error);
            } else {
              console.log('Push token saved successfully');
            }
          } catch (e) {
            console.warn('Failed to save push token:', e);
          }
        }
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration error:', err.error);
      });

      // Handle received notifications when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        // The notification is automatically shown on native platforms
        // You can add custom in-app handling here if needed
      });

      // Handle notification tap (app opened from notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);

        const data = notification.notification?.data;
        if (data?.link) {
          window.location.href = data.link;
        } else if (data?.type === 'match') {
          window.location.href = '/matches';
        } else if (data?.type === 'message') {
          window.location.href = data.chatId ? `/chat/${data.chatId}` : '/matches';
        } else if (data?.type === 'like' || data?.type === 'super_like') {
          window.location.href = '/who-likes-you';
        }
      });

      setIsSetup(true);
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }, [userProfile, isSetup]);

  useEffect(() => {
    setupPushNotifications();

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [setupPushNotifications]);

  return null;
}
