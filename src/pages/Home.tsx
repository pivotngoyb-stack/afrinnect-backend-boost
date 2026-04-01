// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { filterRecords, getCurrentUser, updateRecord, deleteRecord } from '@/lib/supabase-helpers';
import { generateCorrelationId } from '@/lib/correlation';
import { logMutation } from '@/lib/structured-logger';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
const lazyConfetti = () => import('canvas-confetti').then(m => m.default);
import { usePerformanceMonitor } from '@/components/shared/usePerformanceMonitor';
import { useForegroundRefresh } from '@/hooks/useForegroundRefresh';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';
import { hasAccess } from '@/components/shared/TierGate';
import { useTierConfig, getTierLimit, isUnlimited } from '@/components/shared/useTierConfig';
import { useUpgradePrompts } from '@/components/monetization/UpgradePrompts';
import { useVerificationGate } from '@/hooks/useVerificationGate';
import { useLanguage } from '@/components/i18n/LanguageContext';
import AfricanPattern from '@/components/shared/AfricanPattern';
import { AfricanProverbLoader } from '@/components/shared/AfricanCulture';
import BannedScreen from '@/components/auth/BannedScreen';
import VerificationGateBanner from '@/components/shared/VerificationGateBanner';
import HomeHeader from '@/components/home/HomeHeader';
import SwipeView from '@/components/home/SwipeView';
import GridView from '@/components/home/GridView';
import HomeModals from '@/components/home/HomeModals';
import NewMatchToast from '@/components/engagement/NewMatchToast';
import ProfileViewerToast from '@/components/monetization/ProfileViewerToast';
import MissedMatchRegret from '@/components/monetization/MissedMatchRegret';
import { toast } from 'sonner';

// Persist swiped IDs across component remounts within the same session
const getSessionSwipedIds = (): Set<string> => {
  try {
    const stored = sessionStorage.getItem('swiped_ids');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
};
const persistSwipedId = (id: string) => {
  try {
    const current = getSessionSwipedIds();
    current.add(id);
    sessionStorage.setItem('swiped_ids', JSON.stringify([...current]));
  } catch {}
};
const removeSwipedId = (id: string) => {
  try {
    const current = getSessionSwipedIds();
    current.delete(id);
    sessionStorage.setItem('swiped_ids', JSON.stringify([...current]));
  } catch {}
};

export default function Home() {
  usePerformanceMonitor('Home');
  useForegroundRefresh([['discovery-profiles-v2'], ['activity-counts'], ['who-likes-me']]);
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
  const [showMissedMatch, setShowMissedMatch] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [showNewMatchToast, setShowNewMatchToast] = useState(false);
  const [lastMatchedProfile, setLastMatchedProfile] = useState(null);
  const [lastMatchId, setLastMatchId] = useState<string | null>(null);
  // Session-persisted swiped IDs — survives remounts, cleared on new session
  const localSwipedIds = useRef<Set<string>>(getSessionSwipedIds());
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
        queryFn: () => filterRecords('likes', { liked_id: myProfile.id, is_seen: false }, '-created_at', 50, 'id,liker_id'),
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
        const { count: likesCount } = await supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('liked_id', myProfile.id)
          .eq('is_seen', false);
        let views = 0;
        try {
          const { count: viewsCount } = await supabase
            .from('profile_views')
            .select('id', { count: 'exact', head: true })
            .eq('viewed_profile_id', myProfile.id)
            .eq('is_seen', false);
          views = viewsCount || 0;
        } catch {}
        return { likes: likesCount || 0, views };
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
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          if (error?.status === 401) { try { await supabase.auth.signOut(); } catch {} }
          navigate(createPageUrl('Landing'));
          return;
        }
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
        if (user.role === 'admin') setIsAdmin(true);

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id,user_id,display_name,primary_photo,photos,subscription_tier,is_banned,is_suspended,ban_reason,suspension_reason,blocked_users,looking_for,current_country,current_city,current_state,location,is_premium,daily_likes_count,daily_likes_reset_date,login_streak,last_login_date,last_active,has_matched_before,tutorial_completed,device_ids,device_info')
          .eq('user_id', user.id)
          .limit(1);

        if (profiles && profiles.length > 0) {
          const profile = profiles[0];
          if (profile.is_banned || profile.is_suspended) { setMyProfile(profile); return; }

          let deviceId = localStorage.getItem('device_id');
          if (!deviceId) {
            deviceId = navigator.userAgent + '_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_id', deviceId);
          }
          const existingDeviceIds = Array.isArray(profile.device_ids) ? profile.device_ids : [];
          if (!existingDeviceIds.includes(deviceId)) {
            if (existingDeviceIds.length >= 4) { navigate(createPageUrl('Settings')); return; }
            const existingDeviceInfo = Array.isArray(profile.device_info) ? profile.device_info : profile.device_info ? [profile.device_info] : [];
            await updateRecord('user_profiles', profile.id, {
              device_ids: [...existingDeviceIds, deviceId],
              device_info: [...existingDeviceInfo, { device_id: deviceId, device_name: navigator.userAgent.substring(0, 50), last_login: new Date().toISOString() }]
            });
          }
          setMyProfile(profile);

          // Defer login streak update to avoid blocking initial render
          const updateStreak = () => {
            const today = new Date().toISOString().split('T')[0];
            const lastLogin = profile.last_login_date;
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (lastLogin !== today) {
              const newStreak = lastLogin === yesterday ? (profile.login_streak || 0) + 1 : 1;
              updateRecord('user_profiles', profile.id, { login_streak: newStreak, last_login_date: today, last_active: new Date().toISOString() }).catch(() => {});
            }
          };
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(updateStreak);
          } else {
            setTimeout(updateStreak, 3000);
          }
        } else { navigate(createPageUrl('Onboarding')); }
      } catch (error) {
        console.error('Failed to load current profile for discovery:', error);
      }
    };
    fetchMyProfile();
  }, [isCheckingAuth]);

  // Discovery profiles query — uses server-side edge function
  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ['discovery-profiles-v2', filters, discoveryMode, myProfile?.id],
    queryFn: async () => {
      try {
        // Use the server-side discover-profiles edge function
        const { data, error } = await supabase.functions.invoke('discover-profiles', {
          body: {
            profileId: myProfile.id,
            discoveryMode,
            currentCity: myProfile.current_city,
            currentCountry: myProfile.current_country,
            filters: {
              gender: myProfile.looking_for?.length === 1 ? myProfile.looking_for[0] : undefined,
              minAge: filters.age_min,
              maxAge: filters.age_max,
              country: filters.countries_of_origin?.length === 1 ? filters.countries_of_origin[0] : undefined,
              verified: filters.verified_only,
            },
            excludeIds: [...localSwipedIds.current],
            limit: 50,
          }
        });

        if (error) {
          console.error('Discovery edge function error:', error);
          throw error;
        }

        let serverProfiles = data?.profiles || [];

        // Client-side filtering for any additional filters not handled by server
        if (filters.countries_of_origin?.length > 1) {
          serverProfiles = serverProfiles.filter(p => filters.countries_of_origin.includes(p.country_of_origin));
        }
        if (filters.religions?.length > 0) {
          serverProfiles = serverProfiles.filter(p => filters.religions.includes(p.religion));
        }
        if (filters.relationship_goals?.length > 0) {
          serverProfiles = serverProfiles.filter(p => filters.relationship_goals.includes(p.relationship_goal));
        }

        // Filter out any locally swiped IDs (belt-and-suspenders)
        return serverProfiles.filter(p => !localSwipedIds.current.has(p.id));
      } catch (err) {
        console.error('Discovery query failed:', err);
        return [];
      }
    },
    enabled: !!myProfile?.id,
    staleTime: 60000,
    retry: 1
  });

  // Image preloading — preload next 3 cards
  useEffect(() => {
    if (profiles.length === 0) return;
    for (let i = 1; i <= 3; i++) {
      const idx = currentIndex + i;
      if (idx < profiles.length && profiles[idx]?.primary_photo) {
        const img = new Image();
        img.src = profiles[idx].primary_photo;
      }
    }
  }, [currentIndex, profiles]);

  // SPA-safe refresh discovery (no full page reload)
  useEffect(() => {
    const handler = () => {
      localSwipedIds.current = new Set();
      setCurrentIndex(0);
      queryClient.invalidateQueries({ queryKey: ['discovery-profiles-v2'] });
    };
    window.addEventListener('refresh-discovery', handler);
    return () => window.removeEventListener('refresh-discovery', handler);
  }, [queryClient]);

  // Client-side rate limit for likes (max 3 per second)
  const likeTimestamps = useRef<number[]>([]);

  // Like mutation — uses server-side atomic edge function
  const likeMutation = useMutation({
    mutationFn: async ({ likedId, isSuperLike = false, likeNote = null }) => {
      if (!myProfile) return;
      if (isVerificationGated) throw new Error('verification_required');

      // Client-side burst rate limit
      const now = Date.now();
      likeTimestamps.current = likeTimestamps.current.filter(t => now - t < 1000);
      if (likeTimestamps.current.length >= 3) throw new Error('slow_down');
      likeTimestamps.current.push(now);

      const cid = generateCorrelationId('like');
      logMutation('like', cid, 'info', { profile_id: myProfile.id, metadata: { target: likedId, isSuperLike } });

      const { data, error } = await supabase.functions.invoke('like-profile', {
        body: { action: 'like', targetProfileId: likedId, isSuperLike, likeNote }
      });

      if (error) {
        try {
          const errBody = JSON.parse(error.message);
          throw new Error(errBody.error || 'Like failed');
        } catch (e) {
          if (e.message === 'daily_limit_reached') throw e;
          throw new Error(error.message || 'Like failed');
        }
      }

      if (data?.error === 'daily_limit_reached') throw new Error('daily_limit_reached');
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data, variables) => {
      if (data?.isMatch) {
        lazyConfetti().then(confetti => confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#ff6b9d', '#c084fc', '#f59e0b', '#ef4444'] }));
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        setShowMatchCelebration(true);
        setMatchCount(prev => prev + 1);
        setLastMatchedProfile(variables?.profile || pendingLikeProfile);
        setLastMatchId(data.matchId || null);
        // Invalidate matches query so it shows up immediately
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
      }
      if (data?.alreadyLiked) {
        toast('Already liked — moving to next profile');
      }
      setCurrentIndex(prev => prev + 1);
      setProfileViewStartTime(Date.now());
      setPhotosViewedCount(0);
    },
    onError: (error, variables) => {
      if (error.message === 'verification_required') return;
      if (error.message === 'slow_down') {
        toast.info('Slow down! Take a moment between likes.');
        return;
      }
      if (error.message === 'daily_limit_reached') {
        setShowLimitPaywall(true);
        setTimeout(() => setShowMissedMatch(true), 500);
        return;
      }
      if (error.message === 'super_like_limit_reached') {
        toast('You have used your weekly Super Like allowance');
        return;
      }
      if (error.message === 'rewind_requires_upgrade') {
        setShowLimitPaywall(true);
        return;
      }
      console.error('Like mutation error:', error);
      // Keep the swiped ID persisted to prevent reappearance even on error
      if (variables?.likedId) {
        localSwipedIds.current.add(variables.likedId);
        persistSwipedId(variables.likedId);
      }
      toast.error('Something went wrong. Moving to next profile.');
      setCurrentIndex(prev => prev + 1);
      setProfileViewStartTime(Date.now());
      setPhotosViewedCount(0);
    }
  });

  const handleLike = (profile) => {
    if (!profile) return;
    if (likeMutation.isPending || passMutation.isPending) return;
    if (navigator.vibrate) navigator.vibrate(50);
    localSwipedIds.current.add(profile.id);
    persistSwipedId(profile.id);
    setPendingLikeProfile(profile);
    setSwipeHistory(prev => [...prev, { profile, action: 'like', index: currentIndex }]);
    likeMutation.mutate({ likedId: profile.id, profile });
  };

  const handleLikeWithMessage = async (message) => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (!pendingLikeProfile) return;
    localSwipedIds.current.add(pendingLikeProfile.id);
    persistSwipedId(pendingLikeProfile.id);
    setSwipeHistory(prev => [...prev, { profile: pendingLikeProfile, action: 'like', index: currentIndex }]);
    likeMutation.mutate({ likedId: pendingLikeProfile.id, likeNote: message, profile: pendingLikeProfile });
    setShowMessageModal(false);
    setPendingLikeProfile(null);
  };

  const handleSuperLike = async (profile) => {
    if (likeMutation.isPending || passMutation.isPending) return;
    localSwipedIds.current.add(profile.id);
    persistSwipedId(profile.id);
    setPendingLikeProfile(profile);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    setSwipeHistory(prev => [...prev, { profile, action: 'superlike', index: currentIndex }]);
    likeMutation.mutate({ likedId: profile.id, isSuperLike: true, profile });
  };

  // Pass mutation — uses server-side edge function
  const passMutation = useMutation({
    mutationFn: async (profileToPass) => {
      const targetProfile = profileToPass || currentProfile;
      if (!targetProfile?.id) return;
      if (navigator.vibrate) navigator.vibrate(30);
      localSwipedIds.current.add(targetProfile.id);
      persistSwipedId(targetProfile.id);

      const { data, error } = await supabase.functions.invoke('like-profile', {
        body: { action: 'pass', targetProfileId: targetProfile.id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, passedProfile) => {
      const targetProfile = passedProfile || currentProfile;
      if (targetProfile) {
        setSwipeHistory(prev => [...prev, { profile: targetProfile, action: 'pass', index: currentIndex }]);
      }
      setCurrentIndex(prev => prev + 1);
      setProfileViewStartTime(Date.now());
      setPhotosViewedCount(0);
    },
    onError: (_error, passedProfile) => {
      const targetProfile = passedProfile || currentProfile;
      if (targetProfile) {
        setSwipeHistory(prev => [...prev, { profile: targetProfile, action: 'pass', index: currentIndex }]);
      }
      setCurrentIndex(prev => prev + 1);
    }
  });

  const handlePass = (profile = currentProfile) => {
    if (!profile || passMutation.isPending || likeMutation.isPending) return;
    passMutation.mutate(profile);
  };

  const handleRewind = async () => {
    const tier = myProfile?.subscription_tier || 'free';
    const limit = getTierLimit(tierConfig, tier, 'daily_rewinds');
    if (limit === 0) { setShowLimitPaywall(true); return; }
    if (swipeHistory.length === 0) return;

    const lastAction = swipeHistory[swipeHistory.length - 1];

    try {
      // Server-side rewind via edge function — undo like/pass atomically
      const { data, error } = await supabase.functions.invoke('like-profile', {
        body: { action: 'rewind', targetProfileId: lastAction.profile.id }
      });

      if (error) {
        console.error('Rewind failed:', error);
        toast.error('Could not rewind. Please try again.');
        return;
      }

      // Only update local state after server confirms
      localSwipedIds.current.delete(lastAction.profile.id);
      removeSwipedId(lastAction.profile.id);
      setCurrentIndex(lastAction.index);
      setSwipeHistory(swipeHistory.slice(0, -1));
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (err) {
      console.error('Rewind error:', err);
      toast.error('Rewind failed. Try again.');
    }
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

  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    setCurrentIndex(0);
  }, [discoveryMode, myProfile?.id, filtersKey]);

  useEffect(() => {
    if (profiles.length === 0) {
      if (currentIndex !== 0) setCurrentIndex(0);
    }
  }, [profiles.length]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AfricanProverbLoader />
      </div>
    );
  }

  if (myProfile && (myProfile.is_banned || myProfile.is_suspended)) {
    return <BannedScreen userProfile={myProfile} banReason={myProfile.ban_reason || myProfile.suspension_reason || 'Violation of community guidelines'} userEmail={myProfile.created_by} />;
  }

  return (
      <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
        <AfricanPattern className="text-primary" opacity={0.02} variant="adinkra" />

        <HomeHeader
          discoveryMode={discoveryMode} setDiscoveryMode={setDiscoveryMode}
          viewMode={viewMode} setViewMode={setViewMode}
          filters={filters} setFilters={setFilters}
          myProfile={myProfile} isAdmin={isAdmin}
          activityCounts={activityCounts}
          onBoostActivated={() => refetch()}
        />

        {isVerificationGated && <VerificationGateBanner matchCount={gateMatchCount} />}

        <main className="flex-1 flex flex-col overflow-hidden pb-16">
          <div className="flex-1 flex flex-col min-h-0 px-2">
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
                isMutating={likeMutation.isPending || passMutation.isPending}
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
          </div>

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
            lastMatchId={lastMatchId}
          />
          <NewMatchToast
            show={showNewMatchToast}
            matchedProfile={lastMatchedProfile}
            onDismiss={() => setShowNewMatchToast(false)}
          />
          <ProfileViewerToast userProfile={myProfile} />
          <MissedMatchRegret
            show={showMissedMatch && !showLimitPaywall}
            onClose={() => setShowMissedMatch(false)}
          />
        </main>
      </div>
  );
}
