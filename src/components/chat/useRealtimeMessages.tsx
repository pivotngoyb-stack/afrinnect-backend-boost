// @ts-nocheck
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeMessages(matchId: string | null, myProfileId: string | null, enabled = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !matchId || !myProfileId) return;

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${matchId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).sender_id !== myProfileId) {
            queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.user_id !== myProfileId) {
          setOtherUserTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      setIsConnected(false);
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, myProfileId, enabled, queryClient]);

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!matchId || !myProfileId || !isTyping) return;
    const channel = supabase.channel(`chat-${matchId}`);
    channel.send({ type: 'broadcast', event: 'typing', payload: { user_id: myProfileId } });
  }, [matchId, myProfileId]);

  const notifyNewMessage = useCallback((_message: any) => {
    queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
  }, [matchId, queryClient]);

  const sendReadReceipt = useCallback(async (messageId: string) => {
    if (!messageId) return;
    try {
      await supabase
        .from('community_messages')
        .update({ media_url: 'read' } as any)
        .eq('id', messageId);
    } catch (e) {
      console.debug('Read receipt failed:', e);
    }
  }, []);

  return {
    isConnected,
    otherUserTyping,
    sendTypingIndicator,
    notifyNewMessage,
    sendReadReceipt
  };
}
