// @ts-nocheck
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface BadgeCounts {
  matches: number;
  events: number;
  communities: number;
}

export function useBottomNavBadges() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Track which tabs the user has visited — stored as ISO timestamps
  const [lastVisited, setLastVisited] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('nav_last_visited_v2');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setProfileId(data.id);
    };
    load();
  }, []);

  // Mark tab as visited when navigating — update timestamp THEN invalidate
  useEffect(() => {
    const path = location.pathname;
    const tabMap: Record<string, string> = {
      '/matches': 'matches',
      '/chat': 'matches',
      '/wholikesyou': 'matches',
      '/events': 'events',
      '/communities': 'communities',
      '/communitychat': 'communities',
    };
    const tab = tabMap[path];
    if (!tab) return;

    const now = new Date().toISOString();
    setLastVisited(prev => {
      const next = { ...prev, [tab]: now };
      localStorage.setItem('nav_last_visited_v2', JSON.stringify(next));
      return next;
    });

    const timeoutId = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['bottom-nav-badges'] });
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, queryClient]);

  const { data: badges = { matches: 0, events: 0, communities: 0 } } = useQuery({
    queryKey: ['bottom-nav-badges', profileId, lastVisited],
    queryFn: async (): Promise<BadgeCounts> => {
      if (!profileId || !userId) return { matches: 0, events: 0, communities: 0 };

      const matchesLastVisited = lastVisited.matches || null;
      const eventsLastVisited = lastVisited.events || null;
      const communitiesLastVisited = lastVisited.communities || null;

      const [unreadMsgsRes, newLikesRes, newEventsRes, unreadCommunityRes] = await Promise.allSettled([
        // Unread DMs: messages sent to me that are not read
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', profileId)
          .eq('is_read', false),

        // Likes received since last visit to matches tab
        matchesLastVisited
          ? supabase
              .from('likes')
              .select('id', { count: 'exact', head: true })
              .eq('liked_id', profileId)
              .gt('created_at', matchesLastVisited)
          : supabase
              .from('likes')
              .select('id', { count: 'exact', head: true })
              .eq('liked_id', profileId),

        // New events since last visit
        eventsLastVisited
          ? supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .eq('is_active', true)
              .gt('created_at', eventsLastVisited)
              .gte('start_date', new Date().toISOString())
          : supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .eq('is_active', true)
              .gte('start_date', new Date().toISOString())
              .limit(0),

        // Unread community messages since last visit
        (async () => {
          const { data: memberships } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_profile_id', profileId);

          if (!memberships?.length) return { count: 0 };

          const communityIds = memberships.map(m => m.community_id);

          if (communitiesLastVisited) {
            const { count } = await supabase
              .from('community_messages')
              .select('id', { count: 'exact', head: true })
              .in('community_id', communityIds)
              .neq('sender_id', profileId)
              .gt('created_at', communitiesLastVisited);
            return { count: count || 0 };
          }
          return { count: 0 };
        })(),
      ]);

      const safeCount = (result: any) => (result.status === 'fulfilled' ? result.value?.count || 0 : 0);

      const unreadMessages = safeCount(unreadMsgsRes);
      const newLikes = safeCount(newLikesRes);
      const newEvents = safeCount(newEventsRes);
      const unreadCommunity = safeCount(unreadCommunityRes);

      return {
        matches: unreadMessages + newLikes,
        events: newEvents,
        communities: unreadCommunity,
      };
    },
    enabled: !!profileId && !!userId,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  return badges;
}
