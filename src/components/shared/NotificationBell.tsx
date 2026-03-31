// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationBell({ className = "", variant = "ghost" }) {
  const [myProfile, setMyProfile] = React.useState(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .limit(1);
          if (profiles && profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }
      } catch (e) {
        // Not logged in
      }
    };
    fetchProfile();
  }, []);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count', myProfile?.id],
    queryFn: async () => {
      if (!myProfile?.id) return 0;
      try {
        // Only count notification types that actually appear on the Notifications page
        // Messages and likes are shown on the Matches page, not Notifications
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_profile_id', myProfile.id)
          .eq('is_read', false)
          .not('type', 'in', '("message","like","super_like")');
        return count || 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!myProfile?.id,
    refetchInterval: 60000,
    staleTime: 30000
  });

  return (
    <Link to="/notifications">
      <Button variant={variant} size="icon" className={`relative ${className}`}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs rounded-full border-2 border-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}
