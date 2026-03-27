import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Trash2, Plus, Globe, Loader2, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CATEGORIES = [
  'Country', 'Culture', 'Religion', 'Language', 'Diaspora',
  'Interests', 'Professionals', 'Students', 'Sports', 'Music', 'Tech', 'Other'
];

const COUNTRY_ICONS: Record<string, string> = {
  'Nigeria': '🇳🇬', 'Ghana': '🇬🇭', 'Kenya': '🇰🇪', 'South Africa': '🇿🇦',
  'Ethiopia': '🇪🇹', 'Egypt': '🇪🇬', 'Morocco': '🇲🇦', 'Tanzania': '🇹🇿',
  'Uganda': '🇺🇬', 'Cameroon': '🇨🇲', 'Senegal': '🇸🇳', 'Rwanda': '🇷🇼',
  'USA': '🇺🇸', 'UK': '🇬🇧', 'France': '🇫🇷', 'Canada': '🇨🇦', 'Germany': '🇩🇪',
};

export default function CommunityManagement() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: '', image_url: '' });

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['admin-communities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const ids = (data || []).map(c => c.id);
      if (ids.length === 0) return data || [];

      const { data: members } = await supabase
        .from('community_members')
        .select('community_id');

      const countMap: Record<string, number> = {};
      (members || []).forEach(m => {
        countMap[m.community_id] = (countMap[m.community_id] || 0) + 1;
      });

      return (data || []).map(c => ({ ...c, _memberCount: countMap[c.id] || 0 }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('communities').insert({
        name: form.name,
        description: form.description,
        category: form.category || null,
        image_url: form.image_url || null,
        is_active: true,
        member_count: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-communities'] });
      setOpen(false);
      setForm({ name: '', description: '', category: '', image_url: '' });
      toast({ title: 'Community created successfully' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('communities').update({ is_active: !isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-communities'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('communities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-communities'] });
      toast({ title: 'Community deleted' });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get admin profile
      const { data: adminProfiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      const adminProfileId = adminProfiles?.[0]?.id;
      if (!adminProfileId) throw new Error('Admin profile not found');

      // Get all active communities
      const activeCommunities = communities.filter(c => c.is_active);
      if (activeCommunities.length === 0) throw new Error('No active communities');

      // Send message to each community
      const messages = activeCommunities.map(c => ({
        community_id: c.id,
        sender_id: adminProfileId,
        sender_user_id: user.id,
        content: message,
        message_type: 'text',
      }));

      const { error } = await supabase.from('community_messages').insert(messages);
      if (error) throw error;

      return activeCommunities.length;
    },
    onSuccess: (count) => {
      setBroadcastOpen(false);
      setBroadcastMessage('');
      toast({ title: `Message sent to ${count} communities` });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Communities ({communities.length})
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <MessageSquare size={16} /> Broadcast to All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Broadcast Message to All Communities</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  This message will be posted to all {communities.filter(c => c.is_active).length} active communities.
                </p>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Type your announcement..."
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => broadcastMutation.mutate(broadcastMessage)}
                  disabled={!broadcastMessage.trim() || broadcastMutation.isPending}
                  className="w-full"
                >
                  {broadcastMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Send to All Communities
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={16} /> Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Community</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g. Nigerians in Tech"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe this community..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={form.image_url}
                    onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!form.name.trim() || createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Create Community
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        ) : communities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No communities yet. Create your first one!</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {communities.map((community: any) => (
              <div key={community.id} className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {community.image_url ? (
                      <img src={community.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                        {COUNTRY_ICONS[community.name] || '🌍'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{community.name}</h3>
                      <Badge variant="secondary" className="text-xs">{community.category || 'General'}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={community.is_active}
                      onCheckedChange={() => toggleActiveMutation.mutate({ id: community.id, isActive: community.is_active })}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{community.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users size={14} />
                    {community._memberCount} members
                  </div>
                  <Button
                    onClick={() => {
                      if (confirm('Delete this community? This cannot be undone.')) {
                        deleteMutation.mutate(community.id);
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
