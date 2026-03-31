import React, { useState, useEffect, forwardRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineBanner = forwardRef<HTMLDivElement, { isOnline: boolean }>(
  ({ isOnline }, ref) => (
    <motion.div
      ref={ref}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 ${
        isOnline ? 'bg-green-600' : 'bg-red-600'
      } text-white py-3 px-4 text-center shadow-lg`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={20} />
            <span className="font-medium">Back online</span>
          </>
        ) : (
          <>
            <WifiOff size={20} />
            <span className="font-medium">No internet connection</span>
          </>
        )}
      </div>
    </motion.div>
  )
);

OfflineBanner.displayName = 'OfflineBanner';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showBanner && <OfflineBanner isOnline={isOnline} />}
    </AnimatePresence>
  );
}
