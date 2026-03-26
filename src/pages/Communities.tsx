// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Globe, Loader2, CalendarDays, Sparkles, MapPin, Music, BookOpen, Heart, Store, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from '@/hooks/use-toast';
import CountryFlag from '@/components/shared/CountryFlag';
import MarketplaceTab from '@/components/marketplace/MarketplaceTab';
import WelcomeOverlay from '@/components/shared/WelcomeOverlay';
import GuidedActions from '@/components/shared/GuidedActions';

export default function Communities() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, subscription_tier, country_of_origin')
        .eq('user_id', user.id)
        .limit(1);
      return profiles?.[0] ? { ...profiles[0], auth_id: user.id } : null;
    }
  });

  // Show welcome overlay for brand new users (first visit)
  useEffect(() => {
    if (currentUser) {
      const welcomed = localStorage.getItem('afrinnect_welcomed');
      if (!welcomed) {
        setShowWelcome(true);
        localStorage.setItem('afrinnect_welcomed', 'true');
      }
    }
  }, [currentUser]);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_active', true)
        .order('member_count', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser,
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-community-memberships', currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_profile_id', currentUser!.id);
      if (error) throw error;
      return (data || []).map(m => m.community_id);
    },
    enabled: !!currentUser?.id,
  });

  const { data: memberCounts = {} } = useQuery({
    queryKey: ['community-member-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('community_members').select('community_id');
      const counts: Record<string, number> = {};
      (data || []).forEach(m => { counts[m.community_id] = (counts[m.community_id] || 0) + 1; });
      return counts;
    },
    enabled: !!currentUser,
  });

  // Fetch recent community posts for the activity feed
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['recent-community-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_messages')
        .select('id, content, created_at, community_id, sender_id')
        .eq('message_type', 'text')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      // Resolve sender names and community names
      const senderIds = [...new Set((data || []).map(p => p.sender_id))];
      const communityIds = [...new Set((data || []).map(p => p.community_id))];
      const [sendersRes, communitiesRes] = await Promise.all([
        senderIds.length > 0
          ? supabase.from('user_profiles').select('id, display_name, primary_photo').in('id', senderIds)
          : { data: [] },
        communityIds.length > 0
          ? supabase.from('communities').select('id, name').in('id', communityIds)
          : { data: [] },
      ]);
      const senderMap: Record<string, any> = {};
      (sendersRes.data || []).forEach(s => { senderMap[s.id] = s; });
      const communityMap: Record<string, any> = {};
      (communitiesRes.data || []).forEach(c => { communityMap[c.id] = c; });
      return (data || []).map(p => ({
        ...p,
        sender: senderMap[p.sender_id],
        community: communityMap[p.community_id],
      }));
    },
    enabled: !!currentUser,
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase.from('community_members').insert({
        community_id: communityId,
        user_profile_id: currentUser!.id,
        user_id: currentUser!.auth_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-community-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['community-member-counts'] });
      toast({ title: 'Joined community!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const leaveMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_profile_id', currentUser!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-community-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['community-member-counts'] });
      toast({ title: 'Left community' });
    },
  });

  const myCommunities = communities.filter(c => myMemberships.includes(c.id));
  const discoverCommunities = communities.filter(c => {
    const notMember = !myMemberships.includes(c.id);
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return notMember && matchesSearch;
  });

  const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'Country': <Globe size={16} />,
    'Music': <Music size={16} />,
    'Language': <BookOpen size={16} />,
    'Dating': <Heart size={16} />,
    'Events': <CalendarDays size={16} />,
  };

  const CommunityCard = ({ community }: { community: any }) => {
    const isMember = myMemberships.includes(community.id);
    const count = memberCounts[community.id] || 0;

    return (
      <Card className="hover:shadow-lg transition-shadow border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {community.image_url ? (
              <img src={community.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                <CountryFlag country={community.name} showName={false} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{community.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs gap-1">
                  {CATEGORY_ICONS[community.category] || <Globe size={12} />}
                  {community.category || 'General'}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{community.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users size={14} />
              <span>{count} {count === 1 ? 'member' : 'members'}</span>
            </div>
            {isMember ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate(`/communitychat?id=${community.id}`)}>
                  💬 Chat
                </Button>
                <Button size="sm" variant="outline" onClick={() => leaveMutation.mutate(community.id)} disabled={leaveMutation.isPending}>
                  Leave
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => joinMutation.mutate(community.id)} disabled={joinMutation.isPending}>
                Join
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentUser && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view communities</p>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={20} className="text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Afrinnect</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Discover your community
          </h1>
          <p className="text-muted-foreground text-sm">
            Connect beyond dating — find your people, share culture, and build lasting bonds.
          </p>

          {/* Quick action pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 rounded-full h-9 text-xs"
              onClick={() => navigate('/explore')}
            >
              <MapPin size={14} />
              Explore Globally
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 rounded-full h-9 text-xs"
              onClick={() => navigate('/events')}
            >
              <CalendarDays size={14} />
              Upcoming Events
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 rounded-full h-9 text-xs"
              onClick={() => navigate('/stories')}
            >
              <Sparkles size={14} />
              Stories
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <Tabs defaultValue={myCommunities.length > 0 ? 'my-communities' : 'discover'}>
            <TabsList className="mb-5 w-full grid grid-cols-3">
              <TabsTrigger value="my-communities">My Groups</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="marketplace" className="gap-1">
                <Store size={14} /> Market
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-communities">
              {myCommunities.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No communities yet"
                  description="Join communities to connect with like-minded people from your culture"
                  actionLabel="Discover Communities"
                  onAction={() => {}}
                />
              ) : (
                <div className="grid gap-4">
                  {myCommunities.map(c => <CommunityCard key={c.id} community={c} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discover">
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search by name, category, or country..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {discoverCommunities.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title={searchQuery ? 'No communities found' : 'All caught up!'}
                  description={searchQuery ? `No communities match "${searchQuery}"` : "You've joined all available communities."}
                  actionLabel={searchQuery ? 'Clear Search' : undefined}
                  onAction={searchQuery ? () => setSearchQuery('') : undefined}
                />
              ) : (
                <div className="grid gap-4">
                  {discoverCommunities.map(c => <CommunityCard key={c.id} community={c} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="marketplace">
              <MarketplaceTab currentUser={currentUser} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
