/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDFfrqew9sH07QgTT3yc0glYfuDWdW1Hyg",
  authDomain: "afrinnect.firebaseapp.com",
  projectId: "afrinnect",
  storageBucket: "afrinnect.firebasestorage.app",
  messagingSenderId: "1061676943168",
  appId: "1:1061676943168:web:ad3c6151548c30900c5ca5",
  measurementId: "G-8ZBF5S0M3M"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Afrinnect';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.data?.type || 'general',
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200],
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  let targetUrl = '/';

  if (data.link) {
    targetUrl = data.link;
  } else if (data.type === 'match') {
    targetUrl = '/matches';
  } else if (data.type === 'message') {
    targetUrl = data.chatId ? `/chat/${data.chatId}` : '/matches';
  } else if (data.type === 'like' || data.type === 'super_like') {
    targetUrl = '/who-likes-you';
  } else if (data.type === 'event') {
    targetUrl = '/events';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
