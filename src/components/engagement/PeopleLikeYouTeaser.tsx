// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Lock, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface PeopleLikeYouTeaserProps {
  userProfile: any;
  className?: string;
}

export default function PeopleLikeYouTeaser({ userProfile, className = '' }: PeopleLikeYouTeaserProps) {
  const { t } = useLanguage();
  const [count, setCount] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile?.id) return;
    const fetchReal = async () => {
      try {
        const { count: realCount, error } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('liked_id', userProfile.id);

        if (!error && realCount !== null) {
          setCount(realCount);
        } else {
          setCount(0);
        }
      } catch {
        setCount(0);
      }
    };
    fetchReal();
  }, [userProfile?.id]);

  // Don't show until data loads, and don't show if zero
  if (count === null || count === 0) return null;

  const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';
  const noun = count === 1 ? t('engagement.peopleLikeYou.personIs') : t('engagement.peopleLikeYou.peopleAre');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-border rounded-xl p-4 mb-3 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-purple-500/5" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex -space-x-3">
                {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 border-2 border-background flex items-center justify-center">
                    <div className="w-full h-full rounded-full backdrop-blur-sm bg-card/30 flex items-center justify-center">
                      <Heart size={14} className="text-pink-500/70" fill="currentColor" />
                    </div>
                  </motion.div>
                ))}
              </div>
              {!isPremium && <div className="absolute inset-0 backdrop-blur-[2px] rounded-full" />}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {t('engagement.peopleLikeYou.interested').replace('{count}', String(count)).replace('{noun}', noun)}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {isPremium ? (
                  <><Eye size={10} /> {t('engagement.peopleLikeYou.tapToSee')}</>
                ) : (
                  <><Lock size={10} /> {t('engagement.peopleLikeYou.upgradeToSee')}</>
                )}
              </p>
            </div>
          </div>
        </div>

        <Button size="sm" onClick={() => navigate(isPremium ? '/who-likes-you' : '/pricing-plans')}
          className="w-full mt-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs">
          <Sparkles size={14} className="mr-1" />
          {isPremium ? t('engagement.peopleLikeYou.seeWhoLikes') : t('engagement.peopleLikeYou.unlockToSee')}
        </Button>
      </div>
    </motion.div>
  );
}
