// @ts-nocheck
import React from 'react';
import { RotateCcw } from 'lucide-react';
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
  handlePass: (profile: any) => void;
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
  const { t } = useLanguage();

  const handlePass = () => {
    if (currentProfile?.is_seed && Math.random() < 0.2) {
      toast('You almost matched with someone! Keep swiping ✨', {
        icon: '💫',
        duration: 3000,
      });
    }
    originalHandlePass(currentProfile);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-3">
        <ProfileCardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex-1 relative w-full flex items-stretch justify-center overflow-hidden">
      {swipeHistory.length > 0 && (
        <Button
          onClick={handleRewind}
          className={`absolute left-4 top-4 z-20 rounded-full w-11 h-11 shadow-elevated ${
            (myProfile?.subscription_tier === 'premium' || myProfile?.subscription_tier === 'elite' || myProfile?.subscription_tier === 'vip' || myProfile?.is_premium)
              ? 'gradient-gold text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
          title={t('admin.home.rewindLastSwipe')}
        >
          <RotateCcw size={22} />
        </Button>
      )}

      <div className="w-full h-full max-w-2xl px-2 pb-1 min-h-0">
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
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5 shadow-card">
              <span className="text-4xl">💫</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No more profiles right now</h2>
            <p className="text-muted-foreground text-sm mb-6">
              We’ll keep your deck fresh as new people join.
            </p>
            <div className="space-y-3 w-full">
              <Button onClick={() => setFilters({})} className="w-full h-11 text-sm gradient-hero text-primary-foreground">
                Refresh Discovery
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
