// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, RotateCcw } from 'lucide-react';
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
        <ProfileCardSkeleton />
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

      <div className="flex-1 flex items-center justify-center w-full">
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
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5">
              <span className="text-4xl">💫</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">You've seen everyone nearby</h2>
            <p className="text-muted-foreground text-sm mb-6">
              New people join every day. Try expanding your search.
            </p>
            <div className="space-y-3 w-full">
              <Button onClick={() => { setDiscoveryMode?.('global'); setFilters({}); }} className="w-full h-11 text-sm gradient-hero text-primary-foreground">
                <Globe size={16} className="mr-2" />
                Explore Globally
              </Button>
              <Button onClick={() => setFilters({})} variant="outline" className="w-full h-10 text-sm">
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
