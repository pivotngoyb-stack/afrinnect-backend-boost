// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { filterRecords, getCurrentUser } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useForegroundRefresh } from '@/hooks/useForegroundRefresh';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Sparkles, Crown, Eye, Users, Search, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConversationItem from '@/components/messaging/ConversationItem';
import ProfileMini from '@/components/profile/ProfileMini';
import ProfileCard from '@/components/profile/ProfileCard';
import CountdownTimer from '@/components/shared/CountdownTimer';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import NotificationBell from '@/components/shared/NotificationBell';
import EmptyState from '@/components/shared/EmptyState';
import MatchCountdownBanner from '@/components/monetization/MatchCountdownBanner';
import BlurredLikesTeaser from '@/components/monetization/BlurredLikesTeaser';
import SocialProofPaywall from '@/components/monetization/SocialProofPaywall';
import PremiumBadgeOnProfile from '@/components/monetization/PremiumBadgeOnProfile';
import MatchUrgencyPrompt from '@/components/engagement/MatchUrgencyPrompt';
import ChatReminderBanner from '@/components/engagement/ChatReminderBanner';

export default function Matches() {
  const { t } = useLanguage();
  useForegroundRefresh([['matches'], ['conversations-data'], ['likes-received']]);
  
  const [myProfile, setMyProfile] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profiles = await filterRecords('user_profiles', { user_id: user.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      }
    };
    fetchMyProfile();
  }, []);

  // Realtime subscription for new matches and messages
  useEffect(() => {
    if (!myProfile?.id) return;
    
    const channel = supabase
      .channel('matches-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user1_id=eq.${myProfile.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user2_id=eq.${myProfile.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['matches'] });
        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${myProfile.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${myProfile.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [myProfile?.id, queryClient]);

  // Fetch matches - OPTIMIZED: single query with .or() instead of 2 separate calls
  const { data: matchesData = [], isLoading: loadingMatches } = useQuery({
    queryKey: ['matches', myProfile?.id],
    queryFn: async () => {
      try {
        if (!myProfile) return [];

        // Primary source: all matched records for me
        const { data: matchedRows, error } = await supabase
          .from('matches')
          .select('*')
          .eq('is_match', true)
          .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`)
          .order('matched_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Matches query error:', error);
          return [];
        }

        // Secondary source: any match threads where messages already exist
        // (covers legacy/edge rows where status/is_match fields may be inconsistent)
        const { data: messageRows } = await supabase
          .from('messages')
          .select('match_id,created_at')
          .or(`sender_id.eq.${myProfile.id},receiver_id.eq.${myProfile.id}`)
          .order('created_at', { ascending: false })
          .limit(300);

        const messageMatchIds = Array.from(
          new Set((messageRows || []).map((m) => m.match_id).filter(Boolean))
        );

        let messageBackedMatches: any[] = [];
        if (messageMatchIds.length > 0) {
          const { data: messageMatches, error: messageMatchesError } = await supabase
            .from('matches')
            .select('*')
            .in('id', messageMatchIds)
            .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`)
            .limit(100);

          if (messageMatchesError) {
            console.error('Message-backed matches query error:', messageMatchesError);
          } else {
            messageBackedMatches = messageMatches || [];
          }
        }

        const mergedRawMatches = [...(matchedRows || []), ...messageBackedMatches];
        if (!mergedRawMatches.length) return [];

        // Only keep actual matches, unless they already have message history
        const messageMatchSet = new Set(messageMatchIds);
        const validMatches = mergedRawMatches.filter((m) => m?.is_match || messageMatchSet.has(m?.id));
        
        // Filter out matches with blocked users
        const myBlockedUsers = new Set(myProfile.blocked_users || []);
        const filtered = validMatches.filter(m => {
          const partnerId = m.user1_id === myProfile.id ? m.user2_id : m.user1_id;
          return !myBlockedUsers.has(partnerId);
        });
        
        // DEDUPLICATE: Ensure only one match per partner
        const uniqueMatches = new Map();
        filtered.forEach(m => {
          const partnerId = m.user1_id === myProfile.id ? m.user2_id : m.user1_id;
          if (!uniqueMatches.has(partnerId)) {
            uniqueMatches.set(partnerId, m);
          } else {
            const existing = uniqueMatches.get(partnerId);
            if (new Date(m.matched_at || m.created_at) > new Date(existing.matched_at || existing.created_at)) {
              uniqueMatches.set(partnerId, m);
            }
          }
        });

        return Array.from(uniqueMatches.values()).sort((a, b) => 
          new Date(b.matched_at || b.created_at) - new Date(a.matched_at || a.created_at)
        );
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        return [];
      }
    },
    enabled: !!myProfile,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 15000,
    retry: 2,
    retryDelay: 3000
  });

  // Fetch profiles for matches - OPTIMIZED: batch query instead of N+1
  const { data: matchedProfiles = [] } = useQuery({
    queryKey: ['matched-profiles', matchesData.map(m => m.id).join(',')],
    queryFn: async () => {
      try {
        if (!matchesData.length || !myProfile) return [];
        
        const profileIds = matchesData.map(m => 
          m.user1_id === myProfile.id ? m.user2_id : m.user1_id
        );
        
        // OPTIMIZED: Single batch query with .in() instead of N individual queries
        const MATCH_PROFILE_FIELDS = 'id,user_id,display_name,primary_photo,photos,subscription_tier,verification_status,current_city,current_country,country_of_origin,last_active,blocked_users,is_photo_verified,is_id_verified';
        const FALLBACK_MATCH_PROFILE_FIELDS = 'id,user_id,display_name,primary_photo,photos,subscription_tier,verification_status,current_city,current_country,country_of_origin,last_active,blocked_users';

        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select(MATCH_PROFILE_FIELDS)
          .in('id', profileIds);

        let safeProfiles = profiles || [];
        if (error) {
          const { data: fallbackProfiles, error: fallbackError } = await supabase
            .from('user_profiles')
            .select(FALLBACK_MATCH_PROFILE_FIELDS)
            .in('id', profileIds);

          if (fallbackError) throw fallbackError;
          safeProfiles = fallbackProfiles || [];
        }
        
        // Build a map of profile ID -> profile for safe lookup
        const profileMap = new Map();
        safeProfiles.forEach(p => { if (p) profileMap.set(p.id, p); });
        
        // Associate each match with its profile by partner ID
        return matchesData
          .map(m => {
            const partnerId = m.user1_id === myProfile.id ? m.user2_id : m.user1_id;
            const profile = profileMap.get(partnerId);
            return profile ? { ...profile, match: m } : null;
          })
          .filter(Boolean);
      } catch (error) {
        console.error('Failed to fetch matched profiles:', error);
        return [];
      }
    },
    enabled: matchesData.length > 0,
    refetchInterval: false,
    staleTime: 300000,
    retry: 1,
    retryDelay: 5000
  });

  // Re-filter matched profiles against latest blocked_users (handles realtime block updates)
  const safeMatchedProfiles = useMemo(() => {
    if (!myProfile?.blocked_users?.length) return matchedProfiles;
    const blockedSet = new Set(myProfile.blocked_users);
    return matchedProfiles.filter(p => !blockedSet.has(p.id));
  }, [matchedProfiles, myProfile?.blocked_users]);

  // Fetch likes received - OPTIMIZED (excludes likes that became matches)
  const { data: likesReceived = [], isLoading: loadingLikes } = useQuery({
    queryKey: ['likes-received', myProfile?.id, matchesData.length],
    queryFn: async () => {
      try {
        if (!myProfile) return [];
        
        // Get all likes and matches in parallel (only 2 API calls)
        const [allLikes, allMatches] = await Promise.all([
          filterRecords('likes', { liked_id: myProfile.id }, '-created_date', 50, 'id,liker_id,is_super_like,created_at'),
          (async () => {
            // Use direct Supabase query with proper OR grouping
            const { data } = await supabase
              .from('matches')
              .select('user1_id, user2_id')
              .eq('is_match', true)
              .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`);
            return data || [];
          })()
        ]);
        
        // Create a Set of matched user IDs for fast lookup
        const matchedUserIds = new Set(
          allMatches.map(m => 
            m.user1_id === myProfile.id ? m.user2_id : m.user1_id
          )
        );
        
        // Filter out likes from users we already matched with
        const filteredLikes = allLikes.filter(
          like => !matchedUserIds.has(like.liker_id)
        );
        
        return filteredLikes.slice(0, 20);
      } catch (error) {
        console.error('Failed to fetch likes:', error);
        return [];
      }
    },
    enabled: !!myProfile,
    staleTime: 60000,
    retry: 1,
    retryDelay: 5000
  });

  // Fetch profiles of people who liked me - OPTIMIZED: batch query
  const { data: likerProfiles = [] } = useQuery({
    queryKey: ['liker-profiles', likesReceived.map(l => l.liker_id).join(',')],
    queryFn: async () => {
      try {
        if (!likesReceived.length) return [];
        const likerIds = likesReceived.slice(0, 10).map(l => l.liker_id);
        const LIKER_FIELDS = 'id,user_id,display_name,primary_photo,photos,subscription_tier,verification_status,current_city,current_country,is_photo_verified,is_id_verified';
        const FALLBACK_LIKER_FIELDS = 'id,user_id,display_name,primary_photo,photos,subscription_tier,verification_status,current_city,current_country';

        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select(LIKER_FIELDS)
          .in('id', likerIds);

        if (error) {
          const { data: fallbackProfiles, error: fallbackError } = await supabase
            .from('user_profiles')
            .select(FALLBACK_LIKER_FIELDS)
            .in('id', likerIds);

          if (fallbackError) throw fallbackError;
          return (fallbackProfiles || []).filter(Boolean);
        }

        return (profiles || []).filter(Boolean);
      } catch (error) {
        console.error('Failed to fetch liker profiles:', error);
        return [];
      }
    },
    enabled: likesReceived.length > 0,
    staleTime: 600000,
    retry: 1,
    retryDelay: 5000
  });

  // Fetch messages and unread counts — OPTIMIZED: 2 batch queries instead of N*2
  const { data: conversationData = {} } = useQuery({
    queryKey: ['conversations-data', myProfile?.id, matchesData.map(m => m.id).join(',')],
    queryFn: async () => {
      try {
        const matchIds = matchesData.slice(0, 50).map(m => m.id);
        if (!matchIds.length) return {};

        // Batch fetch: last message per match + unread counts in 2 queries
        const [lastMsgsResult, unreadResult] = await Promise.all([
          // Get recent messages for all matches at once
          supabase
            .from('messages')
            .select('id,match_id,content,message_type,sender_id,created_at')
            .in('match_id', matchIds)
            .order('created_at', { ascending: false })
            .limit(Math.max(matchIds.length * 5, 50)),
          // Get unread messages for current user
          supabase
            .from('messages')
            .select('id,match_id')
            .in('match_id', matchIds)
            .eq('receiver_id', myProfile.id)
            .eq('is_read', false)
        ]);

        const data: Record<string, any> = {};
        // Initialize all matches
        matchIds.forEach(id => { data[id] = { lastMessage: null, unreadCount: 0 }; });

        // Process last messages — pick the latest per match
        (lastMsgsResult.data || []).forEach(msg => {
          if (!data[msg.match_id]?.lastMessage) {
            data[msg.match_id] = { ...data[msg.match_id], lastMessage: { ...msg, created_date: msg.created_at } };
          }
        });

        // Count unreads per match
        (unreadResult.data || []).forEach(msg => {
          if (data[msg.match_id]) {
            data[msg.match_id].unreadCount = (data[msg.match_id].unreadCount || 0) + 1;
          }
        });

        return data;
      } catch (error) {
        console.error('Failed to fetch conversation data:', error);
        return {};
      }
    },
    enabled: matchesData.length > 0 && !!myProfile,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
    retryDelay: 5000
  });

  // Filter function for search
  const filterBySearch = (profile) => {
    if (!searchQuery) return true;
    return profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Separate new matches from active conversations
  const newMatches = safeMatchedProfiles.filter(p => {
    const hasMessages = conversationData[p.match?.id]?.lastMessage;
    return !hasMessages && !p.match?.is_expired && filterBySearch(p);
  });
  
  // Active conversations sorted by most recent message
  // Show ALL matches as conversations — ones with messages sorted first, then unmessaged ones
  const conversations = safeMatchedProfiles
    .filter(p => filterBySearch(p))
    .sort((a, b) => {
      const aMsg = conversationData[a.match?.id]?.lastMessage;
      const bMsg = conversationData[b.match?.id]?.lastMessage;
      
      // Matches with messages come first
      if (aMsg && !bMsg) return -1;
      if (!aMsg && bMsg) return 1;
      
      // Both have messages — sort by tier then date
      if (aMsg && bMsg) {
        const aTier = a.subscription_tier || 'free';
        const bTier = b.subscription_tier || 'free';
        const tierPriority = { vip: 3, elite: 2, premium: 1, free: 0 };
        const aPriority = tierPriority[aTier] || 0;
        const bPriority = tierPriority[bTier] || 0;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        const dateA = new Date(aMsg.created_date || 0);
        const dateB = new Date(bMsg.created_date || 0);
        return dateB - dateA;
      }
      
      // Both no messages — sort by match date
      const dateA = new Date(a.match?.matched_at || a.match?.created_date || 0);
      const dateB = new Date(b.match?.matched_at || b.match?.created_date || 0);
      return dateB - dateA;
    });

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-background via-accent/30 to-secondary/20 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('matchesPage.connections')}
              </h1>
              {safeMatchedProfiles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {safeMatchedProfiles.length} match{safeMatchedProfiles.length !== 1 ? 'es' : ''} • {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Search Bar */}
        <div className="flex-shrink-0 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder={t('matchesPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-2 mb-4 flex-shrink-0">
            <TabsTrigger value="matches" className="gap-2">
              <MessageCircle size={16} />
              {t('matchesPage.conversations')}
            </TabsTrigger>
            <TabsTrigger value="likes" className="gap-2 relative">
              <Heart size={16} />
              {t('matchesPage.likesYou')}
              {likesReceived.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {likesReceived.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Conversations Tab - MERGED Matches + Messages */}
          <TabsContent value="matches" className="flex-1 overflow-y-auto space-y-4">
            {loadingMatches && (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingMatches && (
              <>
                {/* Urgency prompts for unmessaged matches */}
                <MatchUrgencyPrompt unmessagedMatches={safeMatchedProfiles} conversationData={conversationData} />
                {/* Dead chat reminders */}
                <ChatReminderBanner staleConversations={safeMatchedProfiles} conversationData={conversationData} myProfile={myProfile} />
                {/* New Matches Row */}
                {newMatches.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-accent" />
                      {t('matchesPage.newMatches')}
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
                      {newMatches.map(profile => (
                        <Link key={profile.id} to={createPageUrl(`Chat?matchId=${profile.match?.id}`)}>
                          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex-shrink-0 w-20 text-center">
                            <div className="relative">
                              <img
                                src={profile.primary_photo || profile.photos?.[0]}
                                alt={profile.display_name}
                                className="w-20 h-20 object-cover rounded-full border-3 border-primary shadow-lg"
                              />
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                                <Heart size={12} className="text-destructive-foreground fill-destructive-foreground" />
                              </div>
                            </div>
                            <p className="text-xs font-medium text-foreground mt-1 truncate">{profile.display_name?.split(' ')[0]}</p>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversations List */}
                {conversations.length > 0 && (
                  <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                    <div className="divide-y divide-border">
                      {conversations.map(profile => {
                        const convData = conversationData[profile.match?.id] || {};
                        return (
                          <Link key={profile.id} to={createPageUrl(`Chat?matchId=${profile.match?.id}`)}>
                            <div className="relative">
                              {/* Priority Badge for Elite/VIP */}
                              {['elite', 'vip'].includes(profile.subscription_tier) && (
                                <div className="absolute top-2 right-2 z-10">
                                  <PremiumBadgeOnProfile tier={profile.subscription_tier} size="icon" />
                                </div>
                              )}
                              <ConversationItem
                                match={profile.match}
                                profile={profile}
                                lastMessage={convData.lastMessage}
                                unreadCount={convData.unreadCount || 0}
                              />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {matchedProfiles.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-destructive/20 rounded-full flex items-center justify-center">
                      <span className="text-4xl">💕</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{t('matchesPage.noMatchesYet')}</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{t('matchesPage.noMatchesDesc')}</p>
                    <Link to="/home">
                      <Button className="bg-gradient-to-r from-primary to-destructive">
                        <Heart size={16} className="mr-2" />
                        {t('matchesPage.startDiscovering')}
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>

          {/* Likes Tab */}
          <TabsContent value="likes" className="flex-1 overflow-y-auto">
            {!myProfile?.is_premium && !['premium', 'elite', 'vip'].includes(myProfile?.subscription_tier) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-6"
              >
                <BlurredLikesTeaser likesCount={likesReceived.length} className="mb-6" />
                <SocialProofPaywall className="max-w-sm mx-auto" />
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {likerProfiles.map(profile => (
                  <ProfileMini
                    key={profile.id}
                    profile={profile}
                    onClick={() => setSelectedProfile(profile)}
                  />
                ))}
                {likerProfiles.length === 0 && !loadingLikes && (
                  <div className="col-span-full">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                        <Heart size={28} className="text-destructive" />
                      </div>
                       <h3 className="text-lg font-bold text-foreground mb-2">{t('matchesPage.noNewLikes')}</h3>
                       <p className="text-muted-foreground mb-4 text-sm">
                          {t('matchesPage.noNewLikesDesc')}
                        </p>
                        <Button 
                          onClick={() => window.location.assign('/pricingplans')}
                          variant="outline"
                          className="border-primary/30 text-primary hover:bg-primary/5"
                        >
                         <Sparkles size={16} className="mr-2" />
                         {t('matchesPage.boostProfile')}
                       </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </main>

        {/* Selected Profile Modal */}
        <AnimatePresence>
          {selectedProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedProfile(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ProfileCard
                  profile={selectedProfile}
                  onLike={() => setSelectedProfile(null)}
                  onPass={() => setSelectedProfile(null)}
                  onSuperLike={() => setSelectedProfile(null)}
                  expanded
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}