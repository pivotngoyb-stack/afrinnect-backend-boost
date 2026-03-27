// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Crown, Zap, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

interface Props {
  userProfile: any;
}

export default function ContextualUpgradeBanner({ userProfile }: Props) {
  if (!userProfile) return null;

  const tier = userProfile.subscription_tier || 'free';
  if (tier === 'elite' || tier === 'vip') return null;

  const tierLimits: Record<string, number> = { free: 10, premium: 50 };
  const limit = tierLimits[tier] || 10;

  const today = new Date().toISOString().split('T')[0];
  const used = userProfile.daily_likes_reset_date === today ? (userProfile.daily_likes_count || 0) : 0;
  const remaining = Math.max(0, limit - used);
  const percentage = (used / limit) * 100;

  // Don't show unless user has used at least 60% of likes
  if (percentage < 60) return null;

  const isEmpty = remaining === 0;
  const isLow = remaining <= 3 && remaining > 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mb-3"
    >
      <div className={`rounded-xl p-3 ${
        isEmpty 
          ? 'bg-destructive/10 border border-destructive/20' 
          : 'bg-amber-500/10 border border-amber-500/20'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isEmpty ? 'bg-destructive/20' : 'bg-amber-500/20'
          }`}>
            {isEmpty ? (
              <AlertTriangle size={20} className="text-destructive" />
            ) : (
              <Heart size={20} className="text-amber-600" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {isEmpty
                ? `You've used all ${limit} likes today!`
                : `${used}/${limit} likes used — only ${remaining} left!`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {isEmpty
                ? 'Upgrade now to keep connecting with amazing people'
                : tier === 'free'
                  ? 'Premium gives you 50 likes/day. Elite gives unlimited!'
                  : 'Upgrade to Elite for unlimited likes!'
              }
            </p>
          </div>

          <Link to={createPageUrl('PricingPlans')} className="shrink-0">
            <Button size="sm" className="gap-1.5 shadow-md">
              <Crown size={14} />
              {isEmpty ? 'Upgrade' : 'Get More'}
            </Button>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isEmpty ? 'bg-destructive' : percentage >= 80 ? 'bg-amber-500' : 'bg-primary'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}
