// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, X } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface DailyReturnBannerProps {
  userProfile: any;
  className?: string;
}

const DailyReturnBanner = React.forwardRef<HTMLDivElement, DailyReturnBannerProps>(function DailyReturnBanner({ userProfile, className = '' }, ref) {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const key = `daily_banner_${new Date().toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      setShown(true);
      sessionStorage.setItem(key, '1');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!shown || dismissed || !userProfile) return null;

  const streak = userProfile.login_streak || 1;

  // Only show streak-based message — no fabricated "someone liked you" claims
  const msg = streak > 1
    ? { text: t('engagement.dailyReturn.streak').replace('{count}', String(streak)), sub: t('engagement.dailyReturn.streakSub'), icon: Flame }
    : { text: t('engagement.dailyReturn.newPeople'), sub: t('engagement.dailyReturn.newPeopleSub'), icon: Star };

  const Icon = msg.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`relative bg-gradient-to-r from-primary/10 via-pink-500/10 to-amber-500/10 border border-primary/20 rounded-xl p-3 mb-3 ${className}`}
      >
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <Icon size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{msg.text}</p>
            <p className="text-xs text-muted-foreground">{msg.sub}</p>
          </div>
        </div>
        {streak > 1 && (
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
              <div key={i} className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                <Flame size={10} className="text-white" />
              </div>
            ))}
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 ml-1">{streak} {t('engagement.dailyReturn.days')}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
