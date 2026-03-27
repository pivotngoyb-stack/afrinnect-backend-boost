// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function ProfileViewsNudge({ userProfile }: { userProfile: any }) {
  const { t } = useLanguage();
  const [viewCount, setViewCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile) return;
    const baseViews = Math.floor(Math.random() * 4) + 2;
    const streakBonus = Math.min(userProfile.login_streak || 0, 5);
    const premiumBonus = ['premium', 'elite', 'vip'].includes(userProfile.subscription_tier) ? 3 : 0;
    setViewCount(baseViews + streakBonus + premiumBonus);
  }, [userProfile]);

  if (!userProfile || viewCount === 0) return null;

  const isPremium = ['premium', 'elite', 'vip'].includes(userProfile?.subscription_tier);
  const destination = isPremium ? createPageUrl('WhoLikesYou') : createPageUrl('PricingPlans');
  const noun = viewCount === 1 ? t('engagement.profileViews.person') : t('engagement.profileViews.people');

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(destination)}
      className="w-full mb-3 flex items-center gap-3 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl px-4 py-3 transition-colors group"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Eye size={18} className="text-primary" />
        </div>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
          {viewCount}
        </span>
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-foreground">
          {t('engagement.profileViews.viewed').replace('{count}', String(viewCount)).replace('{noun}', noun)}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPremium ? t('engagement.profileViews.tapToSee') : t('engagement.profileViews.upgradeToSee')}
        </p>
      </div>
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </motion.button>
  );
}
