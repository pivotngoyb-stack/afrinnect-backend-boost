import React, { useState, useEffect } from 'react';
import { filterRecords } from '@/lib/supabase-helpers';
import { motion } from 'framer-motion';
import { Heart, Crown, Lock, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActivitySummaryBanner({ userProfile }) {
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    const fetchStats = async () => {
      try {
        const likes = await filterRecords('likes', {
          liked_id: userProfile.id,
          is_seen: false
        });
        setLikesCount(likes.length);
      } catch (e) {
        // Silently fail
      }
      setIsLoading(false);
    };
    
    fetchStats();
  }, [userProfile?.id]);

  const isPremium = userProfile?.subscription_tier && userProfile.subscription_tier !== 'free';

  if (isLoading || likesCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-3 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
            <Heart size={16} className="text-pink-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">People like you</p>
            <div className="flex items-center gap-1">
              <p className="font-bold text-pink-700">{likesCount}</p>
              {!isPremium && <Lock size={12} className="text-muted-foreground" />}
            </div>
          </div>
        </div>
        
        {!isPremium && (
          <Link to={createPageUrl('WhoLikesYou')}>
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs">
              <Sparkles size={14} className="mr-1" />
              See who
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
