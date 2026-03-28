// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface BadgeCounts {
  matches: number; // unread conversations + new likes
  events: number;  // upcoming events user hasn't seen
  communities: number; // unread community messages
}

export function useBottomNavBadges() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Track which tabs the user has visited in this session to clear badges
  const [lastVisited, setLastVisited] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('nav_last_visited');
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

  // Mark tab as visited when navigating
  useEffect(() => {
    const path = location.pathname;
    const tabMap: Record<string, string> = {
      '/matches': 'matches',
      '/chat': 'matches',
      '/events': 'events',
      '/communities': 'communities',
      '/communitychat': 'communities',
    };
    const tab = tabMap[path];
    if (tab) {
      const now = Date.now();
      setLastVisited(prev => {
        const next = { ...prev, [tab]: now };
        localStorage.setItem('nav_last_visited', JSON.stringify(next));
        return next;
      });
      // Invalidate to re-check counts
      queryClient.invalidateQueries({ queryKey: ['bottom-nav-badges'] });
    }
  }, [location.pathname]);

  const { data: badges = { matches: 0, events: 0, communities: 0 } } = useQuery({
    queryKey: ['bottom-nav-badges', profileId, lastVisited],
    queryFn: async (): Promise<BadgeCounts> => {
      if (!profileId || !userId) return { matches: 0, events: 0, communities: 0 };

      const matchesLastVisited = lastVisited.matches ? new Date(lastVisited.matches).toISOString() : null;
      const eventsLastVisited = lastVisited.events ? new Date(lastVisited.events).toISOString() : null;
      const communitiesLastVisited = lastVisited.communities ? new Date(lastVisited.communities).toISOString() : null;

      // 1. Unread messages in conversations (messages where I'm receiver and not read)
      const [unreadMsgsRes, newLikesRes, newEventsRes, unreadCommunityRes] = await Promise.all([
        // Unread DMs: messages sent to me that I haven't read
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', profileId)
          .eq('is_read', false),

        // New likes: swipes where someone liked me, since last visit
        matchesLastVisited
          ? supabase
              .from('swipes')
              .select('id', { count: 'exact', head: true })
              .eq('target_id', profileId)
              .eq('action', 'like')
              .gt('created_at', matchesLastVisited)
          : supabase
              .from('swipes')
              .select('id', { count: 'exact', head: true })
              .eq('target_id', profileId)
              .eq('action', 'like'),

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
          // Get my community IDs first
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

      const unreadMessages = unreadMsgsRes.count || 0;
      const newLikes = newLikesRes.count || 0;
      const newEvents = newEventsRes.count || 0;
      const unreadCommunity = unreadCommunityRes.count || 0;

      return {
        matches: unreadMessages + newLikes,
        events: newEvents,
        communities: unreadCommunity,
      };
    },
    enabled: !!profileId,
    refetchInterval: 30000, // refresh every 30s
    staleTime: 10000,
  });

  return badges;
}
