// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { createRecord, deleteRecord, filterRecords, getCurrentUser, isAuthenticated, updateRecord } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
// Lazy-load confetti to reduce initial bundle
const lazyConfetti = () => import('canvas-confetti').then(m => m.default);
import { usePerformanceMonitor } from '@/components/shared/usePerformanceMonitor';
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
  const [showMissedMatch, setShowMissedMatch] = useState(false);
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
        // OPTIMIZED: Use count queries instead of fetching all records
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
        } catch { /* table may not exist yet */ }
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
          const existingDeviceIds = Array.isArray(profile.device_ids) ? profile.device_ids : [];
          if (!existingDeviceIds.includes(deviceId)) {
            if (existingDeviceIds.length >= 4) { navigate(createPageUrl('Settings')); return; }

            const existingDeviceInfoRaw = profile.device_info;
            const existingDeviceInfo = Array.isArray(existingDeviceInfoRaw)
              ? existingDeviceInfoRaw
              : existingDeviceInfoRaw && typeof existingDeviceInfoRaw === 'object'
                ? [existingDeviceInfoRaw]
                : [];

            await updateRecord('user_profiles', profile.id, {
              device_ids: [...existingDeviceIds, deviceId],
              device_info: [
                ...existingDeviceInfo,
                {
                  device_id: deviceId,
                  device_name: navigator.userAgent.substring(0, 50),
                  last_login: new Date().toISOString()
                }
              ]
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
      } catch (error) {
        console.error('Failed to load current profile for discovery:', error);
      }
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
    queryKey: ['discovery-profiles-v2', filters, discoveryMode, myProfile?.id],
    queryFn: async () => {
      try {
        // OPTIMIZED: Select only fields needed for discovery cards
        const DISCOVERY_FIELDS = 'id,user_id,display_name,primary_photo,photos,birth_date,gender,current_country,current_state,current_city,country_of_origin,tribe_ethnicity,ethnicity,bio,interests,cultural_values,relationship_goal,religion,profession,education,languages,location,is_active,is_banned,is_seed,is_photo_verified,is_id_verified,is_premium,subscription_tier,verification_status,blocked_users,looking_for,last_active,daily_likes_count,daily_likes_reset_date,voice_intro_url,prompts,profile_prompts';
        const SAFE_DISCOVERY_FIELDS = 'id,user_id,display_name,primary_photo,photos,birth_date,gender,current_country,current_city,country_of_origin,bio,interests,relationship_goal,religion,profession,education,languages,location,is_active,is_banned,is_seed,is_photo_verified,is_id_verified,is_premium,subscription_tier,verification_status,blocked_users,looking_for,last_active,daily_likes_count,daily_likes_reset_date,voice_intro_url,prompts,profile_prompts';

        const runDiscoveryQuery = async (fields) => supabase
          .from('user_profiles')
          .select(fields)
          .eq('is_active', true)
          .eq('is_banned', false)
          .order('created_at', { ascending: false })
          .limit(500);

        let { data: allProfiles, error: profilesError } = await runDiscoveryQuery(DISCOVERY_FIELDS);

        if (profilesError) {
          console.warn('Primary discovery field set failed; retrying with safe field set:', profilesError);
          const fallback = await runDiscoveryQuery(SAFE_DISCOVERY_FIELDS);
          allProfiles = fallback.data;
          profilesError = fallback.error;
        }

        if (profilesError || !allProfiles) {
          console.error('Discovery profiles fetch error:', profilesError);
          throw profilesError || new Error('Failed to load discovery profiles');
        }

        const [myPasses, myLikes] = await Promise.all([
          filterRecords('passes', { passer_id: myProfile.id }, '-created_at', 500, 'id,passed_id').catch((e) => { console.warn('Passes fetch failed:', e); return []; }),
          filterRecords('likes', { liker_id: myProfile.id }, '-created_at', 500, 'id,liked_id').catch((e) => { console.warn('Likes fetch failed:', e); return []; }),
        ]);

        const passedIds = new Set(myPasses.map(p => p.passed_id));
        const likedIds = new Set(myLikes.map(l => l.liked_id));
        const myBlockedUsers = new Set(myProfile?.blocked_users || []);
        // Bidirectional block: also exclude users who have blocked ME
        const blockedByOthers = new Set(
          allProfiles
            .filter(p => Array.isArray(p.blocked_users) && p.blocked_users.includes(myProfile.id))
            .map(p => p.id)
        );
        const normalize = (value) => String(value || '').trim().toLowerCase();
        const myCountry = normalize(myProfile.current_country);
        // Normalize country aliases to canonical names
        const canonicalize = (c) => {
          const n = normalize(c);
          if (['united states', 'usa', 'us'].includes(n)) return 'united states';
          if (['canada', 'ca'].includes(n)) return 'canada';
          return n;
        };
        const myCanonicalCountry = canonicalize(myProfile.current_country);

        const passesBaseFilters = (p) => {
          // Hide only the exact current profile; allow seed/test profiles even if they share user_id
          if (p.id === myProfile.id) return false;
          if (p.user_id === myProfile.user_id && !p.is_seed) return false;
          if (myBlockedUsers.has(p.id)) return false;
          if (blockedByOthers.has(p.id)) return false; // They blocked me
          if (myProfile.looking_for?.length && !myProfile.looking_for.some((g) => normalize(g) === normalize(p.gender))) return false;
          if (filters.age_min || filters.age_max) {
            const age = calculateAge(p.birth_date);
            if (age && ((filters.age_min && age < filters.age_min) || (filters.age_max && age > filters.age_max))) return false;
          }
          if (filters.countries_of_origin?.length > 0 && !filters.countries_of_origin.includes(p.country_of_origin)) return false;
          if (filters.religions?.length > 0 && !filters.religions.includes(p.religion)) return false;
          if (filters.relationship_goals?.length > 0 && !filters.relationship_goals.includes(p.relationship_goal)) return false;
          if (filters.verified_only) {
            const isVerified = p.verification_status === 'verified' || p.is_photo_verified || p.is_id_verified;
            if (!isVerified) return false;
          }
          return true;
        };

        const matchesMode = (p) => {
          const candidateCanonical = canonicalize(p.current_country);
          if (!candidateCanonical) return discoveryMode === 'global';
          if (discoveryMode === 'local') {
            // Local = same country as the current user
            return candidateCanonical === myCanonicalCountry;
          }
          // Global = different country than the current user
          return candidateCanonical !== myCanonicalCountry;
        };

        const withoutSwipeExclusions = allProfiles.filter((p) => passesBaseFilters(p) && matchesMode(p));
        let filtered = withoutSwipeExclusions.filter((p) => !passedIds.has(p.id) && !likedIds.has(p.id));

        // Auto-fallback: if local mode returns 0 results, expand to global before showing empty state
        if (filtered.length === 0 && discoveryMode === 'local') {
          const globalNoSwipes = allProfiles.filter((p) => passesBaseFilters(p));
          filtered = globalNoSwipes.filter((p) => !passedIds.has(p.id) && !likedIds.has(p.id));
        }

        // Recovery fallback: if user exhausted candidates, resurface existing candidates instead of dead-end empty state
        if (filtered.length === 0) {
          filtered = withoutSwipeExclusions;
        }

        return filtered;
      } catch (err) { console.error('Discovery query failed:', err); return []; }
    },
    enabled: !!myProfile?.id,
    staleTime: 60000,
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

  // Client-side rate limit for likes (max 3 per second to prevent spam taps)
  const likeTimestamps = useRef<number[]>([]);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ likedId, isSuperLike = false, likeNote = null }) => {
      if (!myProfile) return;
      if (isVerificationGated) throw new Error('verification_required');

      // Client-side burst rate limit
      const now = Date.now();
      likeTimestamps.current = likeTimestamps.current.filter(t => now - t < 1000);
      if (likeTimestamps.current.length >= 3) {
        throw new Error('slow_down');
      }
      likeTimestamps.current.push(now);

      const likedProfiles = await filterRecords('user_profiles', { id: likedId });
      if (!likedProfiles.length) throw new Error('Profile not found');
      const likedProfile = likedProfiles[0];

      const { data: existingLike, error: existingLikeError } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', myProfile.id)
        .eq('liked_id', likedId)
        .maybeSingle();

      if (existingLikeError && existingLikeError.code !== 'PGRST116') {
        throw existingLikeError;
      }

      const alreadyLiked = !!existingLike;

      if (!alreadyLiked) {
        if (!canLike()) throw new Error('daily_limit_reached');

        const today = new Date().toISOString().split('T')[0];
        const shouldReset = myProfile.daily_likes_reset_date !== today;
        await updateRecord('user_profiles', myProfile.id, {
          daily_likes_count: shouldReset ? 1 : (myProfile.daily_likes_count || 0) + 1,
          daily_likes_reset_date: today
        });
      }

      const tier = myProfile.subscription_tier || 'free';
      const isPriorityLike = tier === 'elite' || tier === 'vip';

      if (!alreadyLiked) {
        await createRecord('likes', {
          liker_id: myProfile.id, liked_id: likedId,
          liker_user_id: myProfile.user_id, liked_user_id: likedProfile.user_id,
          is_super_like: isSuperLike, is_seen: false,
          is_priority: isPriorityLike,
          priority_boost_expires: isPriorityLike ? new Date(Date.now() + 86400000).toISOString() : null
        });
      }

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

      const mutualLikes = await filterRecords('likes', { liker_id: likedId, liked_id: myProfile.id });

      // Seed matching is now handled server-side by the seed-user-engine
      // for more realistic delayed behavior. Only check existing mutual likes here.

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

          try {
            await supabase.rpc('create_notification', {
              p_user_profile_id: likedId, p_user_id: likedProfile.user_id, p_type: 'match',
              p_title: "It's a Match! 💕", p_message: `You and ${myProfile.display_name} liked each other!`,
              p_from_profile_id: myProfile.id, p_link_to: createPageUrl('Matches')
            });
          } catch (e) { console.warn('Notification skipped (match→liked):', e); }
          try {
            await supabase.rpc('create_notification', {
              p_user_profile_id: myProfile.id, p_user_id: myProfile.user_id, p_type: 'match',
              p_title: "It's a Match! 💕", p_message: `You and ${likedProfile.display_name} liked each other!`,
              p_from_profile_id: likedId, p_link_to: createPageUrl('Matches')
            });
          } catch (e) { console.warn('Notification skipped (match→self):', e); }

          return { isMatch: true };
        }
        return { isMatch: true };
      } else if (!alreadyLiked) {
        try {
          await supabase.rpc('create_notification', {
            p_user_profile_id: likedId, p_user_id: likedProfile.user_id,
            p_type: isSuperLike ? 'super_like' : 'like',
            p_title: isSuperLike ? "You got a Super Like! ⭐" : "Someone likes you!",
            p_message: `${myProfile.display_name} ${isSuperLike ? 'super liked' : 'liked'} your profile`,
            p_from_profile_id: myProfile.id, p_link_to: createPageUrl('Matches')
          });
        } catch (e) { console.warn('Notification skipped (like):', e); }
      }
      return { isMatch: false, alreadyLiked };
    },
    onSuccess: (data, variables) => {
      if (data?.isMatch) {
        lazyConfetti().then(confetti => confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#ff6b9d', '#c084fc', '#f59e0b', '#ef4444'] }));
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        setShowMatchCelebration(true);
        setMatchCount(prev => prev + 1);
        setLastMatchedProfile(variables?.profile || pendingLikeProfile);
        setTimeout(() => {
          setShowMatchCelebration(false);
          setShowNewMatchToast(true);
          setTimeout(() => setShowNewMatchToast(false), 8000);
        }, 3000);
      }
      if (data?.alreadyLiked) {
        toast('Already liked — moving to next profile');
      }
      setCurrentIndex(prev => prev + 1);
      setProfileViewStartTime(Date.now());
      setPhotosViewedCount(0);
    },
    onError: (error) => {
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
      // For any other error, still advance to next profile so the card doesn't get stuck
      console.error('Like mutation error:', error);
      toast.error('Something went wrong. Moving to next profile.');
      setCurrentIndex(prev => prev + 1);
      setProfileViewStartTime(Date.now());
      setPhotosViewedCount(0);
    }
  });

  const handleLike = (profile) => {
    if (!profile) return;
    if (likeMutation.isPending || passMutation.isPending) {
      console.log('Mutation already pending, ignoring tap');
      return;
    }
    if (navigator.vibrate) navigator.vibrate(50);
    setPendingLikeProfile(profile);
    setSwipeHistory(prev => [...prev, { profile, action: 'like', index: currentIndex }]);
    likeMutation.mutate({ likedId: profile.id, profile });
  };
  const handleLikeWithMessage = async (message) => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (!pendingLikeProfile) return;
    setSwipeHistory(prev => [...prev, { profile: pendingLikeProfile, action: 'like', index: currentIndex }]);
    likeMutation.mutate({ likedId: pendingLikeProfile.id, likeNote: message, profile: pendingLikeProfile });
    setShowMessageModal(false); setPendingLikeProfile(null);
  };

  const handleSuperLike = async (profile) => {
    const tier = myProfile?.subscription_tier || 'free';
    if (tier === 'free') {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const weekly = await filterRecords('likes', { liker_id: myProfile.id, is_super_like: true, created_date: { $gte: weekAgo } });
      if (weekly.length >= 1) {
        toast('You have used your weekly Super Like');
        return;
      }
    }
    setPendingLikeProfile(profile);
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    setSwipeHistory(prev => [...prev, { profile, action: 'superlike', index: currentIndex }]);
    likeMutation.mutate({ likedId: profile.id, isSuperLike: true, profile });
  };

  // Pass mutation
  const passMutation = useMutation({
    mutationFn: async (profileToPass) => {
      const targetProfile = profileToPass || currentProfile;
      if (!targetProfile?.id) return;
      if (navigator.vibrate) navigator.vibrate(30);
      await createRecord('passes', {
        passer_id: myProfile.id, passed_id: targetProfile.id,
        passer_user_id: myProfile.user_id, is_rewindable: true
      });
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

  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    setCurrentIndex(0);
  }, [discoveryMode, myProfile?.id, filtersKey]);

  useEffect(() => {
    if (profiles.length === 0) {
      if (currentIndex !== 0) setCurrentIndex(0);
      return;
    }
    if (currentIndex >= profiles.length) setCurrentIndex(0);
  }, [profiles.length, currentIndex]);

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
          {/* Profile cards take priority — full remaining space */}
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

          {/* All modals and toasts — render but don't take layout space */}
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
          <ProfileViewerToast userProfile={myProfile} />
          <MissedMatchRegret
            show={showMissedMatch && !showLimitPaywall}
            onClose={() => setShowMissedMatch(false)}
            matchScore={Math.floor(Math.random() * 10) + 90}
          />
        </main>
      </div>
  );
}
