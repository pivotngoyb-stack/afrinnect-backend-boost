// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '@/components/firebase/firebaseConfig';

export default function PushNotificationSetup({ userProfile }: { userProfile: any }) {
  const [isSetup, setIsSetup] = useState(false);

  const setupPushNotifications = useCallback(async () => {
    if (!userProfile || isSetup) return;

    try {
      const supported = await isSupported();
      if (!supported) {
        console.log('Firebase Messaging not supported in this browser');
        return;
      }

      if (!('serviceWorker' in navigator)) {
        console.log('Service workers not supported');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      let vapidKey: string | undefined;
      try {
        const { data } = await base44.functions.invoke('getVapidKey');
        vapidKey = data?.vapid_key;
        if (!vapidKey) {
          console.warn('VAPID key not configured');
          return;
        }
      } catch (e) {
        console.warn('Failed to get VAPID key:', e);
        return;
      }

      let messaging: any;
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn("Messaging not supported:", e);
        return;
      }

      let swRegistration: ServiceWorkerRegistration | undefined;
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (e) {
        console.warn('Service worker registration failed:', e);
      }

      try {
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration
        });

        if (token) {
          if (userProfile.push_token !== token) {
            try {
              await base44.functions.invoke('updateUserProfile', {
                push_token: token
              });
              console.log('Push token saved successfully');
            } catch (e) {
              console.warn('Failed to save push token:', e);
            }
          }
        }
      } catch (tokenError) {
        console.warn('Failed to get FCM token:', tokenError);
      }

      onMessage(messaging, (payload: any) => {
        console.log('Foreground message received:', payload);
        
        if (Notification.permission === 'granted') {
          const notification = new Notification(
            payload.notification?.title || 'Afrinnect',
            {
              body: payload.notification?.body || '',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              tag: payload.data?.type || 'default',
              data: payload.data,
              requireInteraction: payload.data?.type === 'match' || payload.data?.type === 'super_like'
            }
          );

          notification.onclick = () => {
            window.focus();
            if (payload.data?.link) {
              window.location.href = payload.data.link;
            }
            notification.close();
          };
        }
      });

      setIsSetup(true);
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }, [userProfile, isSetup]);

  useEffect(() => {
    setupPushNotifications();
  }, [setupPushNotifications]);

  return null;
}
