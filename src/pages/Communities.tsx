import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, Search, Globe, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from '@/hooks/use-toast';

export default function Communities() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user + profile
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, subscription_tier')
        .eq('user_id', user.id)
        .limit(1);
      return profiles?.[0] ? { ...profiles[0], auth_id: user.id } : null;
    }
  });

  // Fetch all active communities
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser,
  });

  // Fetch user's memberships
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

  // Fetch member counts
  const { data: memberCounts = {} } = useQuery({
    queryKey: ['community-member-counts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_members')
        .select('community_id');
      const counts: Record<string, number> = {};
      (data || []).forEach(m => {
        counts[m.community_id] = (counts[m.community_id] || 0) + 1;
      });
      return counts;
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

  const COUNTRY_ICONS: Record<string, string> = {
    'Nigeria': '🇳🇬', 'Ghana': '🇬🇭', 'Kenya': '🇰🇪', 'South Africa': '🇿🇦',
    'Ethiopia': '🇪🇹', 'Egypt': '🇪🇬', 'Morocco': '🇲🇦', 'Tanzania': '🇹🇿',
    'Uganda': '🇺🇬', 'Cameroon': '🇨🇲', 'Senegal': '🇸🇳', 'Rwanda': '🇷🇼',
  };

  const CommunityCard = ({ community }: { community: any }) => {
    const isMember = myMemberships.includes(community.id);
    const count = memberCounts[community.id] || 0;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {community.image_url ? (
              <img src={community.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {COUNTRY_ICONS[community.name] || '🌍'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{community.name}</CardTitle>
              <Badge variant="secondary" className="text-xs mt-1">{community.category || 'General'}</Badge>
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
                <Button
                  size="sm"
                  onClick={() => navigate(`/communitychat?id=${community.id}`)}
                >
                  💬 Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => leaveMutation.mutate(community.id)}
                  disabled={leaveMutation.isPending}
                >
                  Leave
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => joinMutation.mutate(community.id)}
                disabled={joinMutation.isPending}
              >
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please log in to view communities</p>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/home">
              <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Communities</h1>
              <p className="text-sm text-muted-foreground">Connect with people worldwide</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <Tabs defaultValue="discover">
            <TabsList className="mb-6">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="my-communities">My Communities ({myCommunities.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="discover">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
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
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoverCommunities.map(c => <CommunityCard key={c.id} community={c} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-communities">
              {myCommunities.length === 0 ? (
              <EmptyState
                  icon={Users}
                  title="No communities yet"
                  description="Join communities to connect with like-minded people"
                  actionLabel="Discover"
                  onAction={() => {}}
                />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myCommunities.map(c => <CommunityCard key={c.id} community={c} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
