// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Heart, Lock, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function ActivitySummaryBanner({ userProfile }) {
  const { t } = useLanguage();
  const [likesCount, setLikesCount] = useState<number | null>(null);

  useEffect(() => {
    if (!userProfile?.id) return;
    const fetchStats = async () => {
      try {
        const { count, error } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('liked_id', userProfile.id)
          .eq('is_seen', false);
        setLikesCount(!error ? (count || 0) : 0);
      } catch {
        setLikesCount(0);
      }
    };
    fetchStats();
  }, [userProfile?.id]);

  const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';

  if (likesCount === null || likesCount === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/5 to-pink-500/5 border border-border rounded-xl p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-500/10 rounded-full flex items-center justify-center">
            <Heart size={16} className="text-pink-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('monetization.activitySummary.peopleLikeYou')}</p>
            <div className="flex items-center gap-1">
              <p className="font-bold text-foreground">{likesCount}</p>
              {!isPremium && <Lock size={12} className="text-muted-foreground" />}
            </div>
          </div>
        </div>
        {!isPremium && (
          <Link to={createPageUrl('WhoLikesYou')}>
            <Button size="sm" className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-600 text-primary-foreground text-xs">
              <Sparkles size={14} className="mr-1" />
              {t('monetization.activitySummary.seeWho')}
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
