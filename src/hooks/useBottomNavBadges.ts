// @ts-nocheck
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface BadgeCounts {
  matches: number;
  events: number;
  communities: number;
}

export function useBottomNavBadges() {
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

  const { data: badges = { matches: 0, events: 0, communities: 0 } } = useQuery({
    queryKey: ['bottom-nav-badges', profileId],
    queryFn: async (): Promise<BadgeCounts> => {
      if (!profileId || !userId) return { matches: 0, events: 0, communities: 0 };

      const [unreadMsgsRes, unseenLikesRes] = await Promise.allSettled([
        // Unread DMs — pure is_read=false count
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', profileId)
          .eq('is_read', false),

        // Unseen likes — pure is_seen=false count
        supabase
          .from('likes')
          .select('id', { count: 'exact', head: true })
          .eq('liked_id', profileId)
          .eq('is_seen', false),
      ]);

      const safeCount = (r: any) => {
        if (r.status !== 'fulfilled') return 0;
        const val = r.value;
        if (val && typeof val.count === 'number') return val.count;
        return 0;
      };

      return {
        matches: safeCount(unreadMsgsRes) + safeCount(unseenLikesRes),
        events: 0,
        communities: 0,
      };
    },
    enabled: !!profileId && !!userId,
    refetchInterval: 30000,
    staleTime: 5000,
  });

  return badges;
}
