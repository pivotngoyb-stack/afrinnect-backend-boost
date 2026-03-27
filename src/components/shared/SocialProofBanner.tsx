import React from 'react';
import { Eye, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface SocialProofBannerProps {
  viewsToday?: number;
  likesThisWeek?: number;
  percentile?: number;
}

export default function SocialProofBanner({ viewsToday = 0, likesThisWeek = 0, percentile = 50 }: SocialProofBannerProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-4 border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={20} className="text-primary" />
        <h3 className="font-semibold text-foreground">Your Profile Performance</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye size={16} className="text-blue-600" />
            <span className="text-2xl font-bold text-foreground">{viewsToday}</span>
          </div>
          <p className="text-xs text-muted-foreground">Views Today</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={16} className="text-pink-600" />
            <span className="text-2xl font-bold text-foreground">{likesThisWeek}</span>
          </div>
          <p className="text-xs text-muted-foreground">Likes This Week</p>
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-600 bg-clip-text text-transparent">
            Top {percentile}%
          </span>
          <p className="text-xs text-muted-foreground">In Your Area</p>
        </div>
      </div>
    </motion.div>
  );
}
