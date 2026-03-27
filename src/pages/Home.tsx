// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { createRecord, deleteRecord, filterRecords, getCurrentUser, isAuthenticated, updateRecord } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import confetti from 'canvas-confetti';
import { usePerformanceMonitor } from '@/components/shared/usePerformanceMonitor';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';
import { hasAccess } from '@/components/shared/TierGate';
import { useTierConfig, getTierLimit, isUnlimited } from '@/components/shared/useTierConfig';
import { useUpgradePrompts } from '@/components/monetization/UpgradePrompts';
import { useVerificationGate } from '@/hooks/useVerificationGate';
import { useLanguage } from '@/components/i18n/LanguageContext';
import AfricanPattern from '@/components/shared/AfricanPattern';
import PullToRefresh from '@/components/shared/PullToRefresh';
import BannedScreen from '@/components/auth/BannedScreen';
import FoundingMemberBanner from '@/components/founding/FoundingMemberBanner';
import VerificationGateBanner from '@/components/shared/VerificationGateBanner';
import ActivitySummaryBanner from '@/components/monetization/ActivitySummaryBanner';
import WeeklyTopPicks from '@/components/monetization/WeeklyTopPicks';
import VIPEventsPromo from '@/components/monetization/VIPEventsPromo';
import BoostButton from '@/components/monetization/BoostButton';
import HomeHeader from '@/components/home/HomeHeader';
import SwipeView from '@/components/home/SwipeView';
import GridView from '@/components/home/GridView';
import HomeModals from '@/components/home/HomeModals';
import ProfileCompletionBar from '@/components/engagement/ProfileCompletionBar';
import LiveActivityFeed from '@/components/engagement/LiveActivityFeed';
import ProfileViewsNudge from '@/components/engagement/ProfileViewsNudge';
import DailyReturnBanner from '@/components/engagement/DailyReturnBanner';
import PeopleLikeYouTeaser from '@/components/engagement/PeopleLikeYouTeaser';
import NewMatchToast from '@/components/engagement/NewMatchToast';
import ContextualUpgradeBanner from '@/components/monetization/ContextualUpgradeBanner';
import BlurredLikesTeaser from '@/components/monetization/BlurredLikesTeaser';
import { Loader2 } from 'lucide-react';

export default function Home() {
  usePerformanceMonitor('Home');
  const { trackEvent } = useConversionTracker();
  const { t } = useLanguage();

  const [viewMode, setViewMode] = useState('swipe');
  const [discoveryMode, setDiscoveryMode] = useState('local');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showLimitPaywall, setShowLimitPaywall] = useState(false);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [pendingLikeProfile, setPendingLikeProfile] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackProfile, setFeedbackProfile] = useState(null);
  const [profileViewStartTime, setProfileViewStartTime] = useState(Date.now());
  const [photosViewedCount, setPhotosViewedCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [showNewMatchToast, setShowNewMatchToast] = useState(false);
  const [lastMatchedProfile, setLastMatchedProfile] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { prompt: upgradePrompt, dismissPrompt } = useUpgradePrompts(myProfile);
  const { tiers: tierConfig } = useTierConfig();
  const { isGated: isVerificationGated, matchCount: gateMatchCount } = useVerificationGate(myProfile);

  // Prefetch activity data
  useEffect(() => {
    if (!myProfile?.id) return;
    const timer = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ['who-likes-me', myProfile.id],
        queryFn: () => filterRecords('likes', { liked_id: myProfile.id, is_seen: false }, '-created_at', 50),
        staleTime: 120000
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [myProfile?.id, queryClient]);

  const { data: activityCounts } = useQuery({
    queryKey: ['activity-counts', myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return { likes: 0, views: 0 };
      try {
        const likes = await filterRecords('likes', { liked_id: myProfile.id, is_seen: false });
        return { likes: likes.length, views: 0 };
      } catch { return { likes: 0, views: 0 }; }
    },
    enabled: !!myProfile?.id,
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 1
  });

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await isAuthenticated();
        if (!isAuth) { navigate(createPageUrl('Landing')); return; }
        setIsCheckingAuth(false);
      } catch { navigate(createPageUrl('Landing')); }
    };
    checkAuth();
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (isCheckingAuth) return;
    const fetchMyProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) { navigate(createPageUrl('Landing')); return; }
        if (user.role === 'admin' || user.email === 'pivotngoyb@gmail.com') setIsAdmin(true);

        const profiles = await filterRecords('user_profiles', { user_id: user.id });
        if (profiles.length > 0) {
          const profile = profiles[0];
          if (profile.is_banned || profile.is_suspended) { setMyProfile(profile); return; }

          let deviceId = localStorage.getItem('device_id');
          if (!deviceId) {
            deviceId = navigator.userAgent + '_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_id', deviceId);
          }
          const existingDeviceIds = profile.device_ids || [];
          if (!existingDeviceIds.includes(deviceId)) {
            if (existingDeviceIds.length >= 4) { navigate(createPageUrl('Settings')); return; }
            await updateRecord('user_profiles', profile.id, {
              device_ids: [...existingDeviceIds, deviceId],
              device_info: [...(profile.device_info || []), { device_id: deviceId, device_name: navigator.userAgent.substring(0, 50), last_login: new Date().toISOString() }]
            });
          }
          setMyProfile(profile);

          // Update login streak
          const today = new Date().toISOString().split('T')[0];
          const lastLogin = profile.last_login_date;
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          if (lastLogin !== today) {
            try {
              let newStreak = profile.login_streak || 0;
              newStreak = lastLogin === yesterday ? newStreak + 1 : 1;
              await updateRecord('user_profiles', profile.id, { login_streak: newStreak, last_login_date: today, last_active: new Date().toISOString() });
            } catch {}
          }
        } else { navigate(createPageUrl('Onboarding')); }
      } catch {}
    };
    fetchMyProfile();
  }, [isCheckingAuth]);

  // Helpers
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Discovery profiles query
  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ['discovery-profiles', filters, discoveryMode, myProfile?.id],
    queryFn: async () => {
      try {
        const [allProfiles, myPasses, myLikes] = await Promise.all([
          filterRecords('user_profiles', { is_active: true, is_banned: false }, '-created_at', 200),
          filterRecords('passes', { passer_id: myProfile.id }, '-created_at', 500).catch(() => []),
          filterRecords('likes', { liker_id: myProfile.id }, '-created_at', 500).catch(() => []),
        ]);

        const passedIds = new Set(myPasses.map(p => p.passed_id));
        const likedIds = new Set(myLikes.map(l => l.liked_id));
        const myBlockedUsers = new Set(myProfile?.blocked_users || []);

        let filtered = allProfiles.filter(p => {
          if (p.user_id === myProfile.user_id) return false;
          if (myBlockedUsers.has(p.id) || passedIds.has(p.id) || likedIds.has(p.id)) return false;
          if (myProfile.looking_for?.length && !myProfile.looking_for.includes(p.gender)) return false;
          if (filters.age_min || filters.age_max) {
            const age = p.age || calculateAge(p.birth_date);
            if (age && ((filters.age_min && age < filters.age_min) || (filters.age_max && age > filters.age_max))) return false;
          }
          if (filters.countries_of_origin?.length > 0 && !filters.countries_of_origin.includes(p.country_of_origin)) return false;
          if (filters.religions?.length > 0 && !filters.religions.includes(p.religion)) return false;
          if (filters.relationship_goals?.length > 0 && !filters.relationship_goals.includes(p.relationship_goal)) return false;
          if (filters.verified_only && !p.is_verified) return false;
          if (discoveryMode === 'local' && myProfile.current_country && p.current_country !== myProfile.current_country) return false;
          return true;
        });

        // Auto-fallback: if local mode returns 0 results, expand to global
        if (filtered.length === 0 && discoveryMode === 'local') {
          filtered = allProfiles.filter(p => {
            if (p.user_id === myProfile.user_id) return false;
            if (myBlockedUsers.has(p.id) || passedIds.has(p.id) || likedIds.has(p.id)) return false;
            if (myProfile.looking_for?.length && !myProfile.looking_for.includes(p.gender)) return false;
            return true;
          });
        }

        return filtered;
      } catch { return []; }
    },
    enabled: !!myProfile?.id,
    staleTime: 300000,
    retry: 1
  });

  // Image preloading
  useEffect(() => {
    if (profiles.length > 0 && currentIndex + 1 < profiles.length) {
      const img = new Image();
      img.src = profiles[currentIndex + 1]?.primary_photo;
    }
  }, [currentIndex, profiles]);

  // Like limit check
  const canLike = () => {
    if (isAdmin) return true;
    const tier = myProfile?.subscription_tier || 'free';
    const limit = getTierLimit(tierConfig, tier, 'daily_likes');
    if (isUnlimited(limit)) return true;
    const today = new Date().toISOString().split('T')[0];
    if (myProfile?.daily_likes_reset_date !== today) return true;
    return (myProfile?.daily_likes_count || 0) < limit;
  };

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ likedId, isSuperLike = false, likeNote = null }) => {
      if (!myProfile) return;
      if (isVerificationGated) throw new Error('verification_required');
      if (!canLike()) throw new Error('daily_limit_reached');

      const today = new Date().toISOString().split('T')[0];
      const shouldReset = myProfile.daily_likes_reset_date !== today;
      await updateRecord('user_profiles', myProfile.id, {
        daily_likes_count: shouldReset ? 1 : (myProfile.daily_likes_count || 0) + 1,
        daily_likes_reset_date: today
      });

      const likedProfiles = await filterRecords('user_profiles', { id: likedId });
      if (!likedProfiles.length) throw new Error('Profile not found');
      const likedProfile = likedProfiles[0];

      const tier = myProfile.subscription_tier || 'free';
      const isPriorityLike = tier === 'elite' || tier === 'vip';

      await createRecord('likes', {
        liker_id: myProfile.id, liked_id: likedId,
        liker_user_id: myProfile.user_id, liked_user_id: likedProfile.user_id,
        is_super_like: isSuperLike, is_seen: false,
        is_priority: isPriorityLike,
        priority_boost_expires: isPriorityLike ? new Date(Date.now() + 86400000).toISOString() : null
      });

      if (likeNote) {
        const { data: existingMatch } = await supabase.from('matches').select('id')
          .or(`and(user1_id.eq.${myProfile.id},user2_id.eq.${likedId}),and(user1_id.eq.${likedId},user2_id.eq.${myProfile.id})`);
        if (existingMatch?.length > 0) {
          await createRecord('messages', {
            match_id: existingMatch[0].id, sender_id: myProfile.id, receiver_id: likedId,
            sender_user_id: myProfile.user_id, receiver_user_id: likedProfile.user_id,
            content: likeNote, message_type: 'text', like_note: likeNote
          });
        }
      }

      let mutualLikes = await filterRecords('likes', { liker_id: likedId, liked_id: myProfile.id });

      // Variable reward: guaranteed first match, then 30-80% probability for seed profiles
      const isFirstMatch = !myProfile.has_matched_before;
      const sessionSeedChance = 0.3 + Math.random() * 0.5; // 30-80% per session
      if (mutualLikes.length === 0 && likedProfile.is_seed && (isFirstMatch || Math.random() < sessionSeedChance)) {
        await createRecord('likes', {
          liker_id: likedId, liked_id: myProfile.id,
          liker_user_id: likedProfile.user_id, liked_user_id: myProfile.user_id,
          is_super_like: false, is_seen: true,
        });
        mutualLikes = [{ id: 'seed-auto' }];
      }

      if (mutualLikes.length > 0) {
        const { data: existingMatches } = await supabase.from('matches').select('id')
          .or(`and(user1_id.eq.${myProfile.id},user2_id.eq.${likedId}),and(user1_id.eq.${likedId},user2_id.eq.${myProfile.id})`);

        if (!existingMatches?.length) {
          if (!myProfile.has_matched_before) {
            trackEvent(CONVERSION_EVENTS.FIRST_MATCH);
            await updateRecord('user_profiles', myProfile.id, { has_matched_before: true });
          }

          await createRecord('matches', {
            user1_id: myProfile.id, user2_id: likedId,
            user1_user_id: myProfile.user_id, user2_user_id: likedProfile.user_id,
            user1_liked: true, user2_liked: true, is_match: true,
            matched_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            is_expired: false, last_chance_sent: false, first_message_sent: false, status: 'active'
          });

          await createRecord('notifications', {
            user_profile_id: likedId, user_id: likedProfile.user_id, type: 'match',
            title: "It's a Match! 💕", message: `You and ${myProfile.display_name} liked each other!`,
            from_profile_id: myProfile.id, link_to: createPageUrl('Matches')
          });
          await createRecord('notifications', {
            user_profile_id: myProfile.id, user_id: myProfile.user_id, type: 'match',
            title: "It's a Match! 💕", message: `You and ${likedProfile.display_name} liked each other!`,
            from_profile_id: likedId, link_to: createPageUrl('Matches')
          });

          return { isMatch: true };
        }
        return { isMatch: true };
      } else {
        await createRecord('notifications', {
          user_profile_id: likedId, user_id: likedProfile.user_id,
          type: isSuperLike ? 'super_like' : 'like',
          title: isSuperLike ? "You got a Super Like! ⭐" : "Someone likes you!",
          message: `${myProfile.display_name} ${isSuperLike ? 'super liked' : 'liked'} your profile`,
          from_profile_id: myProfile.id, link_to: createPageUrl('Matches')
        });
      }
      return { isMatch: false };
    },
    onSuccess: (data) => {
      if (data?.isMatch) {
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#ff6b9d', '#c084fc', '#f59e0b', '#ef4444'] });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        setShowMatchCelebration(true);
        setMatchCount(prev => prev + 1);
        setLastMatchedProfile(pendingLikeProfile);
        setTimeout(() => {
          setShowMatchCelebration(false);
          setShowNewMatchToast(true);
          setTimeout(() => setShowNewMatchToast(false), 8000);
        }, 3000);
      }
      setCurrentIndex(prev => prev + 1);
    },
    onError: (error) => {
      if (error.message === 'verification_required') return;
      if (error.message === 'daily_limit_reached') setShowLimitPaywall(true);
    }
  });

  const handleLike = (profile) => { setPendingLikeProfile(profile); setShowMessageModal(true); };
  const handleLikeWithMessage = async (message) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setSwipeHistory([...swipeHistory, { profile: pendingLikeProfile, action: 'like', index: currentIndex }]);
    likeMutation.mutate({ likedId: pendingLikeProfile.id, likeNote: message });
    setShowMessageModal(false); setPendingLikeProfile(null);
  };

  const handleSuperLike = async (profile) => {
    const tier = myProfile?.subscription_tier || 'free';
    if (tier === 'free') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const weekly = await filterRecords('likes', { liker_id: myProfile.id, is_super_like: true, created_date: { $gte: weekAgo } });
      if (weekly.length >= 1) return;
    }
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    setSwipeHistory([...swipeHistory, { profile, action: 'superlike', index: currentIndex }]);
    likeMutation.mutate({ likedId: profile.id, isSuperLike: true });
  };

  // Pass mutation
  const passMutation = useMutation({
    mutationFn: async () => {
      if (navigator.vibrate) navigator.vibrate(30);
      await createRecord('passes', {
        passer_id: myProfile.id, passed_id: currentProfile.id,
        passer_user_id: myProfile.user_id, is_rewindable: true
      });
    },
    onSuccess: () => {
      setSwipeHistory([...swipeHistory, { profile: currentProfile, action: 'pass', index: currentIndex }]);
      setCurrentIndex(prev => prev + 1);
      setProfileViewStartTime(Date.now());
      setPhotosViewedCount(0);
    },
    onError: () => {
      setSwipeHistory([...swipeHistory, { profile: currentProfile, action: 'pass', index: currentIndex }]);
      setCurrentIndex(prev => prev + 1);
    }
  });

  const handlePass = () => passMutation.mutate();

  const handleRewind = async () => {
    const tier = myProfile?.subscription_tier || 'free';
    const limit = getTierLimit(tierConfig, tier, 'daily_rewinds');
    if (limit === 0) { setShowLimitPaywall(true); return; }
    if (swipeHistory.length === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];
    if (lastAction.action === 'like' || lastAction.action === 'superlike') {
      const existing = await filterRecords('likes', { liker_id: myProfile.id, liked_id: lastAction.profile.id });
      for (const l of existing) await deleteRecord('likes', l.id);
    }
    if (lastAction.action === 'pass') {
      const existing = await filterRecords('passes', { passer_id: myProfile.id, passed_id: lastAction.profile.id });
      for (const p of existing) await deleteRecord('passes', p.id);
    }
    setCurrentIndex(lastAction.index);
    setSwipeHistory(swipeHistory.slice(0, -1));
    if (navigator.vibrate) navigator.vibrate(100);
  };

  const completeTutorial = async () => {
    if (myProfile) await updateRecord('user_profiles', myProfile.id, { tutorial_completed: true });
  };

  const tutorialSteps = [
    { icon: '👋', title: 'Welcome to Afrinnect!', description: 'Swipe right to like, left to pass.' },
    { icon: '⭐', title: 'Super Like', description: 'Tap the star to super like someone special!' },
    { icon: '🔥', title: 'Daily Matches', description: 'Check your daily curated matches!' },
    { icon: '💎', title: 'Premium Features', description: 'Upgrade for unlimited likes and more!' }
  ];

  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (myProfile && (myProfile.is_banned || myProfile.is_suspended)) {
    return <BannedScreen userProfile={myProfile} banReason={myProfile.ban_reason || myProfile.suspension_reason || 'Violation of community guidelines'} userEmail={myProfile.created_by} />;
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
        <AfricanPattern className="text-primary" opacity={0.02} />

        <HomeHeader
          discoveryMode={discoveryMode} setDiscoveryMode={setDiscoveryMode}
          viewMode={viewMode} setViewMode={setViewMode}
          filters={filters} setFilters={setFilters}
          myProfile={myProfile} isAdmin={isAdmin}
          activityCounts={activityCounts}
        />

        <FoundingMemberBanner profile={myProfile} />
        {isVerificationGated && <VerificationGateBanner matchCount={gateMatchCount} />}

        <main className="flex-1 flex flex-col overflow-hidden px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ContextualUpgradeBanner userProfile={myProfile} />
          {!['premium', 'elite', 'vip'].includes(myProfile?.subscription_tier) && (
            <BlurredLikesTeaser likesCount={activityCounts?.likes || 0} className="mb-3" />
          )}
          <DailyReturnBanner userProfile={myProfile} />
          <LiveActivityFeed userProfile={myProfile} />
          <ProfileCompletionBar userProfile={myProfile} />
          <PeopleLikeYouTeaser userProfile={myProfile} />
          <ProfileViewsNudge userProfile={myProfile} />
          <ActivitySummaryBanner userProfile={myProfile} />
          <div className="mb-3">
            <BoostButton userProfile={myProfile} onBoostActivated={() => refetch()} />
          </div>

          {viewMode === 'swipe' ? (
            <SwipeView
              isLoading={isLoading}
              currentProfile={currentProfile}
              hasMoreProfiles={hasMoreProfiles}
              myProfile={myProfile}
              swipeHistory={swipeHistory}
              likeMutation={likeMutation}
              passMutation={passMutation}
              handleLike={handleLike}
              handlePass={handlePass}
              handleSuperLike={handleSuperLike}
              handleRewind={handleRewind}
              setFilters={setFilters}
              setDiscoveryMode={setDiscoveryMode}
            />
          ) : (
            <GridView
              profiles={profiles}
              myProfile={myProfile}
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
              handleLike={handleLike}
              handleSuperLike={handleSuperLike}
            />
          )}

          <HomeModals
            showLimitPaywall={showLimitPaywall} setShowLimitPaywall={setShowLimitPaywall}
            showTutorial={showTutorial} tutorialSteps={tutorialSteps} completeTutorial={completeTutorial}
            showMatchCelebration={showMatchCelebration} setShowMatchCelebration={setShowMatchCelebration}
            showMessageModal={showMessageModal} setShowMessageModal={setShowMessageModal}
            pendingLikeProfile={pendingLikeProfile} setPendingLikeProfile={setPendingLikeProfile}
            handleLikeWithMessage={handleLikeWithMessage}
            matchCount={matchCount} myProfile={myProfile}
            showFeedbackModal={showFeedbackModal} setShowFeedbackModal={setShowFeedbackModal}
            feedbackProfile={feedbackProfile} setFeedbackProfile={setFeedbackProfile}
            upgradePrompt={upgradePrompt} dismissPrompt={dismissPrompt}
          />
          <NewMatchToast
            show={showNewMatchToast}
            matchedProfile={lastMatchedProfile}
            onDismiss={() => setShowNewMatchToast(false)}
          />
          <div className="h-20" />
        </main>
      </div>
    </PullToRefresh>
  );
}
