// @ts-nocheck
import React from 'react';
import { Eye, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface SocialProofBannerProps {
  viewsToday?: number;
  likesThisWeek?: number;
}

/**
 * SocialProofBanner — only shows real, source-backed stats.
 * Removed fabricated "Top X%" percentile claim.
 */
export default function SocialProofBanner({ viewsToday = 0, likesThisWeek = 0 }: SocialProofBannerProps) {
  // Don't render if there's no real data to show
  if (viewsToday === 0 && likesThisWeek === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={20} className="text-primary" />
        <h3 className="font-semibold text-foreground">Your Profile Performance</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {viewsToday > 0 && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye size={16} className="text-primary" />
              <span className="text-2xl font-bold text-foreground">{viewsToday}</span>
            </div>
            <p className="text-xs text-muted-foreground">Views Today</p>
          </div>
        )}
        {likesThisWeek > 0 && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={16} className="text-pink-500" />
              <span className="text-2xl font-bold text-foreground">{likesThisWeek}</span>
            </div>
            <p className="text-xs text-muted-foreground">Likes This Week</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
