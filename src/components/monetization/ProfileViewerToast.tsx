// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Crown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const VIEWER_NAMES = ['Someone special', 'A verified member', 'A Premium member', 'An Elite member', 'Someone nearby'];

export default function ProfileViewerToast({ userProfile }: { userProfile: any }) {
  const [visible, setVisible] = useState(false);
  const [viewerName, setViewerName] = useState('');

  const tier = userProfile?.subscription_tier || 'free';
  const isPaid = ['premium', 'elite', 'vip'].includes(tier);

  useEffect(() => {
    if (!userProfile?.id || isPaid) return;

    // Show first notification after 45-90 seconds, then every 3-5 minutes
    const firstDelay = 45000 + Math.random() * 45000;
    
    const showNotification = () => {
      setViewerName(VIEWER_NAMES[Math.floor(Math.random() * VIEWER_NAMES.length)]);
      setVisible(true);
      setTimeout(() => setVisible(false), 8000);
    };

    const firstTimer = setTimeout(() => {
      showNotification();
      const interval = setInterval(() => {
        showNotification();
      }, 180000 + Math.random() * 120000); // 3-5 min
      return () => clearInterval(interval);
    }, firstDelay);

    return () => clearTimeout(firstTimer);
  }, [userProfile?.id, isPaid]);

  if (isPaid || !userProfile) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, x: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="fixed bottom-28 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50"
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-pink-500/5" />
            
            <button
              onClick={() => setVisible(false)}
              className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full"
            >
              <X size={14} />
            </button>

            <div className="relative flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center shrink-0"
              >
                <Eye size={20} className="text-primary-foreground" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {viewerName} is viewing your profile 👀
                </p>
                <p className="text-xs text-muted-foreground">
                  Upgrade to see who's checking you out
                </p>
              </div>
            </div>

            <Link to={createPageUrl('PricingPlans')}>
              <Button size="sm" className="w-full mt-3 gap-1.5">
                <Crown size={14} />
                See Who's Looking
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
