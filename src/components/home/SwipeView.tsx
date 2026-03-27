// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, RotateCcw, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import ProfileCard from '@/components/profile/ProfileCard';
import { ProfileCardSkeleton } from '@/components/shared/SkeletonLoader';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { toast } from 'sonner';

interface SwipeViewProps {
  isLoading: boolean;
  currentProfile: any;
  hasMoreProfiles: boolean;
  myProfile: any;
  swipeHistory: any[];
  likeMutation: any;
  passMutation: any;
  handleLike: (profile: any) => void;
  handlePass: () => void;
  handleSuperLike: (profile: any) => void;
  handleRewind: () => void;
  setFilters: (f: any) => void;
  setDiscoveryMode?: (mode: string) => void;
}

export default function SwipeView({
  isLoading, currentProfile, hasMoreProfiles, myProfile,
  swipeHistory, likeMutation, passMutation,
  handleLike, handlePass: originalHandlePass, handleSuperLike, handleRewind, setFilters,
  setDiscoveryMode,
}: SwipeViewProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [nearMissCount, setNearMissCount] = useState(0);

  const handlePass = () => {
    // 1 in 5 passes on seed profiles triggers "Almost matched!" near-miss
    if (currentProfile?.is_seed && Math.random() < 0.2) {
      toast('You almost matched with someone! Keep swiping ✨', {
        icon: '💫',
        duration: 3000,
      });
    }
    originalHandlePass();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <ProfileCardSkeleton />
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">Finding amazing people for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start pt-1 relative">
      {swipeHistory.length > 0 && (
        <Button
          onClick={handleRewind}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full w-12 h-12 shadow-elevated ${
            (myProfile?.subscription_tier === 'premium' || myProfile?.subscription_tier === 'elite' || myProfile?.subscription_tier === 'vip' || myProfile?.is_premium)
              ? 'gradient-gold text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
          title={t('admin.home.rewindLastSwipe')}
        >
          <RotateCcw size={22} />
        </Button>
      )}

      <AnimatePresence mode="wait">
        {hasMoreProfiles && currentProfile ? (
          <ProfileCard
            key={currentProfile.id}
            profile={currentProfile}
            myLocation={myProfile?.location}
            onLike={() => handleLike(currentProfile)}
            onPass={handlePass}
            onSuperLike={() => handleSuperLike(currentProfile)}
            isLiking={likeMutation.isPending && !likeMutation.variables?.isSuperLike}
            isPassing={passMutation.isPending}
            isSuperLiking={likeMutation.isPending && likeMutation.variables?.isSuperLike}
            matchScore={currentProfile.matchScore}
            matchReasons={currentProfile.matchReasons || []}
            matchBreakdown={currentProfile.matchBreakdown || {}}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6"
            >
              <span className="text-5xl">💫</span>
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">You're getting noticed!</h2>
            <p className="text-muted-foreground mb-2">
              You've seen everyone here — but new people are joining every day.
            </p>
            <p className="text-sm text-primary font-medium mb-6">
              Your next match could be one swipe away ✨
            </p>
            <div className="space-y-3 w-full">
              <Button onClick={() => { setDiscoveryMode?.('global'); setFilters({}); }} className="w-full h-12 text-base gradient-hero text-primary-foreground">
                <Globe size={18} className="mr-2" />
                Explore Globally
              </Button>
              <Button onClick={() => setFilters({})} variant="outline" className="w-full h-11">
                Reset Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
