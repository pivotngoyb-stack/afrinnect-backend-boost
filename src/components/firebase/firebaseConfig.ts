import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

// Firebase config - public keys are safe to expose (Firebase docs confirm this)
const firebaseConfig = {
  apiKey: "AIzaSyDFfrqew9sH07QgTT3yc0glYfuDWdW1Hyg",
  authDomain: "afrinnect.firebaseapp.com",
  projectId: "afrinnect",
  storageBucket: "afrinnect.firebasestorage.app",
  messagingSenderId: "1061676943168",
  appId: "1:1061676943168:web:ad3c6151548c30900c5ca5",
  measurementId: "G-8ZBF5S0M3M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics — only initialize where supported (not in SSR/workers)
let analytics: ReturnType<typeof getAnalytics> | null = null;
isAnalyticsSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});
export { analytics };

// Cloud Messaging — only initialize where supported
let messaging: ReturnType<typeof getMessaging> | null = null;
isMessagingSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch(() => {});
export { messaging };

export { app };
