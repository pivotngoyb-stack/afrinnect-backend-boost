// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { deleteRecord, filterRecords, getCurrentUser, updateRecord } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Users, MessageCircle, Crown, Shield, Trash2, CheckCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmptyState from '@/components/shared/EmptyState';

export default function Notifications() {
  const [myProfile, setMyProfile] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profiles = await filterRecords('user_profiles', { user_id: user.id });
          if (profiles.length > 0) {
            setMyProfile(profiles[0]);
          }
        }
      } catch (e) {
        console.log('Not logged in');
      }
    };
    fetchProfile();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', myProfile?.id],
    queryFn: async () => {
      try {
        const allNotifs = await filterRecords('notifications', 
          { user_profile_id: myProfile.id },
          '-created_date',
          50
        );
        
        // Filter out message and like notifications — those belong in Matches page
        const filteredNotifs = allNotifs.filter(n => 
          n.type !== 'message' && n.type !== 'like' && n.type !== 'super_like'
        );
        
        return filteredNotifs.sort((a, b) => {
          const priority = (notif) => {
            if (notif.type === 'match') return 0;
            if (notif.type === 'admin_message') return 1;
            return 2;
          };
          
          const priorityDiff = priority(a) - priority(b);
          if (priorityDiff !== 0) return priorityDiff;
          
          return new Date(b.created_date) - new Date(a.created_date);
        });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!myProfile,
    staleTime: 120000,
    retry: 1,
    retryDelay: 5000
  });

  const markReadMutation = useMutation({
    mutationFn: (notifId) => updateRecord('notifications', notifId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['bottom-nav-badges'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!myProfile?.id) return;
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_profile_id', myProfile.id)
        .eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['bottom-nav-badges'] });
    }
  });

  // Mark notifications as read after a short delay so user has time to see them
  useEffect(() => {
    if (notifications.length > 0 && notifications.some(n => !n.is_read)) {
      const timer = setTimeout(() => {
        markAllReadMutation.mutate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notifications, myProfile?.id]);

  const deleteNotifMutation = useMutation({
    mutationFn: (notifId) => deleteRecord('notifications', notifId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['bottom-nav-badges'] });
    }
  });

  const normalizeNotificationLink = (linkTo) => {
    if (!linkTo) return null;

    let normalized = linkTo;

    // Support absolute URLs stored in older notifications
    if (normalized.startsWith('http')) {
      try {
        const parsed = new URL(normalized);
        normalized = `${parsed.pathname}${parsed.search}`;
      } catch {
        return linkTo;
      }
    }

    // Trim leading/trailing whitespace
    normalized = normalized.trim();

    // Legacy chat format: /chat/<matchId>
    if (normalized.startsWith('/chat/')) {
      const matchId = normalized.split('/chat/')[1]?.split(/[?#]/)[0];
      return matchId ? createPageUrl('Chat', { matchId }) : createPageUrl('Chat');
    }

    // Legacy query format: /chat?match=<matchId> or /chat?matchId=<matchId>
    if (normalized.startsWith('/chat?') || normalized === '/chat') {
      const query = normalized.split('?')[1] || '';
      const params = new URLSearchParams(query);
      const matchId = params.get('matchId') || params.get('match');
      return matchId ? createPageUrl('Chat', { matchId }) : '/matches';
    }

    // Legacy event format: /events/<eventId>
    if (normalized.startsWith('/events/')) {
      const eventId = normalized.split('/events/')[1]?.split(/[?#]/)[0];
      return eventId ? createPageUrl('EventDetails', { id: eventId }) : createPageUrl('Events');
    }

    // Community deep links: /community/<id> or /communities/<id>
    if (/^\/(community|communities)\//.test(normalized)) {
      const id = normalized.split(/\/(community|communities)\//)[2]?.split(/[?#]/)[0];
      return id ? `/communitychat?communityId=${id}` : '/communities';
    }

    // Profile deep links: /profile/<id>
    if (normalized.startsWith('/profile/')) {
      const id = normalized.split('/profile/')[1]?.split(/[?#]/)[0];
      return id ? `/profile?id=${id}` : '/home';
    }

    // Who likes you deep link
    if (normalized === '/who-likes-you' || normalized === '/wholikesyou') {
      return '/wholikesyou';
    }

    // Matches shortcut
    if (normalized === '/matches' || normalized === '/match') {
      return '/matches';
    }

    // Settings / account
    if (normalized === '/settings' || normalized === '/account') {
      return '/settings';
    }

    // Pricing
    if (normalized === '/pricing' || normalized === '/upgrade') {
      return '/pricingplans';
    }

    return normalized;
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }

    const targetPath = normalizeNotificationLink(notif.link_to);
    if (targetPath) {
      // Track deep link for debug panel
      sessionStorage.setItem('__last_deep_link', targetPath);
      navigate(targetPath);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match': return <Heart className="text-pink-500" size={24} />;
      case 'like': return <Heart className="text-purple-500" size={24} />;
      case 'super_like': return <Crown className="text-amber-500" size={24} />;
      case 'message': return <MessageCircle className="text-blue-500" size={24} />;
      case 'admin_message': return <Shield className="text-red-500" size={24} />;
      default: return <Users className="text-muted-foreground" size={24} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-muted pb-24">
      <header className="sticky top-0 z-40 bg-card border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft size={24} />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary">{unreadCount} new</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:bg-primary/5"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck size={18} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="max-w-2xl mx-auto">
        <div className="p-4 space-y-2">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No notifications yet"
                description="We'll let you know when you get likes, matches, or messages"
                className="py-8"
              />
            ) : (
              notifications.map((notif, idx) => {
                return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    notif.is_read
                      ? 'bg-card border-border'
                      : 'bg-primary/5 border-primary/20'
                  } ${notif.is_admin ? 'border-l-4 border-l-destructive' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{notif.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notif.message}
                          </p>
                          {notif.is_admin && (
                            <Badge className="mt-2 bg-red-600 text-xs">From Admin</Badge>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotifMutation.mutate(notif.id);
                          }}
                          className="text-muted-foreground hover:text-red-500 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notif.created_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )})
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}