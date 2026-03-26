import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Crown, Infinity } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LikesCounter({ userProfile, onLimitReached }) {
  const [likesUsed, setLikesUsed] = useState(0);
  const [likesMax, setLikesMax] = useState(10);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    const tier = userProfile.subscription_tier || 'free';
    
    const tierLimits = {
      free: 10,
      premium: 50,
      elite: -1,
      vip: -1
    };
    
    const dailyLikesLimit = tierLimits[tier] || 10;
    
    if (dailyLikesLimit === -1) {
      setLikesMax(-1);
    } else {
      setLikesMax(dailyLikesLimit);
    }

    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const resetDate = userProfile.daily_likes_reset_date;
    
    if (resetDate === today) {
      setLikesUsed(userProfile.daily_likes_count || 0);
    } else {
      setLikesUsed(0);
    }
  }, [userProfile]);

  const tier = userProfile?.subscription_tier || 'free';
  const isUnlimitedTier = tier === 'elite' || tier === 'vip';
  const remaining = likesMax === -1 ? Infinity : Math.max(0, likesMax - likesUsed);
  const isEmpty = remaining === 0;
  const isLow = remaining <= 3 && remaining > 0;

  if (isUnlimitedTier) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-3 py-1.5 text-white">
        <Heart size={14} className="fill-white" />
        <span className="text-xs font-bold flex items-center gap-1">
          <Infinity size={14} />
          Unlimited
        </span>
      </div>
    );
  }

  return (
    <Link to={isEmpty ? createPageUrl('PricingPlans') : '#'}>
      <motion.div
        animate={isEmpty ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: isEmpty ? Infinity : 0, duration: 1 }}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer transition-all ${
          isEmpty 
            ? 'bg-gradient-to-r from-amber-100 to-red-100 text-red-700'
            : isLow
              ? 'bg-amber-50 text-amber-700'
              : 'bg-pink-50 text-pink-700'
        }`}
      >
        <Heart size={14} className={isEmpty ? 'text-muted-foreground' : 'fill-pink-500 text-pink-500'} />
        <span className="text-xs font-bold">
          {remaining}/{likesMax} likes
        </span>
        {isEmpty && (
          <Crown size={12} className="text-amber-500" />
        )}
      </motion.div>
    </Link>
  );
}