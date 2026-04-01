// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Heart, Sparkles } from 'lucide-react';

export default function MatchProbabilityIndicator({ likesReceived, isPremium }) {
  // Only show if there's real data
  if (!likesReceived || likesReceived <= 0) return null;

  let message = '';
  let icon = TrendingUp;

  if (likesReceived >= 10) {
    message = "You're on fire! 🔥";
    icon = Sparkles;
  } else if (likesReceived >= 5) {
    message = "You're getting noticed!";
    icon = TrendingUp;
  } else if (likesReceived >= 1) {
    message = `${likesReceived} ${likesReceived === 1 ? 'person likes' : 'people like'} you!`;
    icon = Heart;
  }

  const Icon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary"
    >
      <Icon size={14} />
      <span className="text-xs font-medium">{message}</span>
      
      {!isPremium && likesReceived > 0 && (
        <span className="text-xs opacity-70">• Upgrade to see who!</span>
      )}
    </motion.div>
  );
}
