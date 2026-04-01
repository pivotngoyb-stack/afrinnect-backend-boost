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

const TAB_MAP: Record<string, string> = {
  '/matches': 'matches',
  '/chat': 'matches',
  '/wholikesyou': 'matches',
  '/notifications': 'matches',
  '/events': 'events',
  '/eventdetails': 'events',
  '/communities': 'communities',
  '/communitychat': 'communities',
};

function getStoredTimestamps(): Record<string, string> {
  try {
    const stored = localStorage.getItem('nav_last_visited_v3');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function setStoredTimestamp(tab: string) {
  const current = getStoredTimestamps();
  const now = new Date().toISOString();
  current[tab] = now;
  localStorage.setItem('nav_last_visited_v3', JSON.stringify(current));
  return current;
}

export function useBottomNavBadges() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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

  // When navigating to a tab, record the timestamp and force badge refresh
  useEffect(() => {
    const tab = TAB_MAP[location.pathname];
    if (!tab) return;

    // Update timestamp in localStorage
    setStoredTimestamp(tab);

    // Force a refetch after a small delay to ensure localStorage is written
    const id = window.setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['bottom-nav-badges'] });
    }, 150);

    return () => window.clearTimeout(id);
  }, [location.pathname, queryClient]);

  const { data: badges = { matches: 0, events: 0, communities: 0 } } = useQuery({
    queryKey: ['bottom-nav-badges', profileId],
    queryFn: async (): Promise<BadgeCounts> => {
      if (!profileId || !userId) return { matches: 0, events: 0, communities: 0 };

      // Always read fresh from localStorage — not from React state
      const timestamps = getStoredTimestamps();
      const matchesSince = timestamps.matches || null;
      const eventsSince = timestamps.events || null;
      const communitiesSince = timestamps.communities || null;

      const [unreadMsgsRes, newLikesRes, newEventsRes, unreadCommunityRes] = await Promise.allSettled([
        // Unread DMs
        (() => {
          let q = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('receiver_id', profileId)
            .eq('is_read', false);
          if (matchesSince) q = q.gt('created_at', matchesSince);
          return q;
        })(),

        // Likes received — only count unseen likes
        (() => {
          let q = supabase
            .from('likes')
            .select('id', { count: 'exact', head: true })
            .eq('liked_id', profileId)
            .eq('is_seen', false);
          if (matchesSince) q = q.gt('created_at', matchesSince);
          return q;
        })(),

        // New events
        (() => {
          let q = supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .gte('start_date', new Date().toISOString());
          if (eventsSince) {
            q = q.gt('created_at', eventsSince);
          } else {
            // Never visited events → don't show badge for pre-existing events
            q = q.limit(0);
          }
          return q;
        })(),

        // Community messages
        (async () => {
          const { data: memberships } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_profile_id', profileId);

          if (!memberships?.length) return { count: 0 };

          const communityIds = memberships.map(m => m.community_id);

          if (communitiesSince) {
            const { count } = await supabase
              .from('community_messages')
              .select('id', { count: 'exact', head: true })
              .in('community_id', communityIds)
              .neq('sender_id', profileId)
              .gt('created_at', communitiesSince);
            return { count: count || 0 };
          }
          return { count: 0 };
        })(),
      ]);

      const safeCount = (r: any) => {
        if (r.status !== 'fulfilled') return 0;
        const val = r.value;
        if (val && typeof val.count === 'number') return val.count;
        return 0;
      };

      return {
        matches: safeCount(unreadMsgsRes) + safeCount(newLikesRes),
        events: safeCount(newEventsRes),
        communities: safeCount(unreadCommunityRes),
      };
    },
    enabled: !!profileId && !!userId,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  return badges;
}
