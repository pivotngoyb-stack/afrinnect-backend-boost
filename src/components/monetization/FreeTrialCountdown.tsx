import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Clock, Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function FreeTrialCountdown({ userProfile }: { userProfile: any }) {
  const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expired, setExpired] = useState(false);

  const tier = userProfile?.subscription_tier || 'free';
  const isPaid = ['premium', 'elite', 'vip'].includes(tier);

  useEffect(() => {
    if (!userProfile?.id || isPaid) return;

    // Check if trial was already started
    const storageKey = `trial_start_${userProfile.id}`;
    const dismissKey = `trial_dismissed_${userProfile.id}`;
    let trialStart = localStorage.getItem(storageKey);

    if (localStorage.getItem(dismissKey)) {
      setDismissed(true);
      return;
    }

    if (!trialStart) {
      // Start the trial clock on first session
      trialStart = Date.now().toString();
      localStorage.setItem(storageKey, trialStart);
    }

    const startTime = parseInt(trialStart);
    const endTime = startTime + TRIAL_DURATION_MS;

    const update = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [userProfile?.id, isPaid]);

  if (isPaid || dismissed || !userProfile) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`trial_dismissed_${userProfile.id}`, 'true');
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Expired state — more aggressive CTA
  if (expired) {
    return (
      <div className="mb-3">
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Your free trial preview has ended</p>
              <p className="text-xs text-muted-foreground">Upgrade now to keep all Premium features</p>
            </div>
            <Link to={createPageUrl('PricingPlans')} className="shrink-0">
              <Button size="sm" className="gap-1.5">
                <Crown size={14} />
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!timeLeft) return null;

  const isUrgent = timeLeft.h < 2;

  return (
    <div className="mb-3">
      <div className={`rounded-xl p-3 relative overflow-hidden ${
        isUrgent 
          ? 'bg-gradient-to-r from-destructive/10 to-amber-500/10 border border-destructive/20' 
          : 'bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/20'
      }`}>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground rounded-full"
        >
          <X size={12} />
        </button>

        <div className="flex items-center gap-3">
          <motion.div
            animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isUrgent ? 'bg-destructive/20' : 'bg-primary/20'
            }`}
          >
            <Zap size={20} className={isUrgent ? 'text-destructive' : 'text-primary'} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              {isUrgent ? '⚡ Premium trial ending soon!' : '🎉 Premium trial active!'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-muted-foreground" />
              <span className={`text-sm font-mono font-bold ${isUrgent ? 'text-destructive' : 'text-primary'}`}>
                {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">remaining</span>
            </div>
          </div>

          <Link to={createPageUrl('PricingPlans')} className="shrink-0">
            <Button size="sm" variant={isUrgent ? 'default' : 'outline'} className="gap-1.5">
              <Crown size={14} />
              {isUrgent ? 'Upgrade Now' : 'Keep Features'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
