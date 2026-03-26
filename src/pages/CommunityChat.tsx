import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Users, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function CommunityChat() {
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get('id');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, primary_photo, photos')
        .eq('user_id', user.id)
        .limit(1);
      return profiles?.[0] ? { ...profiles[0], auth_id: user.id } : null;
    }
  });

  // Community details
  const { data: community, isLoading: loadingCommunity } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!communityId,
  });

  // Member count
  const { data: memberCount = 0 } = useQuery({
    queryKey: ['community-member-count', communityId],
    queryFn: async () => {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId!);
      return count || 0;
    },
    enabled: !!communityId,
  });

  // Check if current user is a member
  const { data: isMember = false } = useQuery({
    queryKey: ['community-membership-check', communityId, currentUser?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId!)
        .eq('user_profile_id', currentUser!.id);
      return (count || 0) > 0;
    },
    enabled: !!communityId && !!currentUser?.id,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['community-messages', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('community_id', communityId!)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!communityId,
    refetchInterval: 3000,
  });

  // Fetch sender profiles for messages
  const senderIds = [...new Set(messages.map((m: any) => m.sender_id).filter(Boolean))];
  const { data: senderProfiles = [] } = useQuery({
    queryKey: ['sender-profiles', senderIds.join(',')],
    queryFn: async () => {
      if (senderIds.length === 0) return [];
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, primary_photo, photos')
        .in('id', senderIds);
      return data || [];
    },
    enabled: senderIds.length > 0,
  });

  const profileMap = Object.fromEntries(senderProfiles.map((p: any) => [p.id, p]));

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('community_messages').insert({
        community_id: communityId!,
        sender_id: currentUser!.id,
        sender_user_id: currentUser!.auth_id,
        content: content.trim(),
        message_type: 'text',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['community-messages', communityId] });
    },
    onError: (e: any) => toast({ title: 'Failed to send', description: e.message, variant: 'destructive' }),
  });

  const handleSend = () => {
    if (!message.trim() || !currentUser || !isMember) return;
    sendMutation.mutate(message);
  };

  if (loadingCommunity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center bg-background">
        <Users size={48} className="text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Community Not Found</h2>
        <Link to="/communities"><Button>Back to Communities</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/communities">
            <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="font-bold text-foreground">{community.name}</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={12} />
              <span>{memberCount} members</span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const sender = profileMap[msg.sender_id];
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <img
                      src={sender?.primary_photo || sender?.photos?.[0] || '/placeholder.svg'}
                      alt={sender?.display_name || 'User'}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </Avatar>
                  <div className={`flex flex-col ${isMe ? 'items-end' : ''}`}>
                    <p className="text-xs text-muted-foreground mb-1">{sender?.display_name || 'Unknown'}</p>
                    <div className={`rounded-2xl px-4 py-2 max-w-xs ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {isMember ? (
        <div className="fixed bottom-20 left-0 right-0 bg-card border-t shadow-lg p-4 z-50">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!message.trim() || sendMutation.isPending}>
              {sendMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-20 left-0 right-0 bg-card border-t shadow-lg p-4 z-50">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-muted-foreground mb-2">Join this community to participate in the chat</p>
            <Link to="/communities">
              <Button size="sm">Join Community</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
