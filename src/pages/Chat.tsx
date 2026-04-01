// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { createRecord, filterRecords, getCurrentUser, invokeFunction, invokeLLM, updateRecord, uploadFile } from '@/lib/supabase-helpers';
import { generateCorrelationId } from '@/lib/correlation';
import { logMutation } from '@/lib/structured-logger';
import { supabase } from '@/integrations/supabase/client';
import { useForegroundRefresh } from '@/hooks/useForegroundRefresh';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Mic, Image, Languages, AlertTriangle, MoreVertical, Flag, Sparkles, Shield, Ban, Video, Gift, Wand2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoResizeTextarea } from "@/components/ui/autosize-textarea";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import IceBreakerPrompts from '@/components/chat/IceBreakerPrompts';
import AIConversationStarters from '@/components/chat/AIConversationStarters';
import AIConversationHelper from '@/components/chat/AIConversationHelper';
import { AnimatePresence } from 'framer-motion';
import TypingIndicator from '@/components/shared/TypingIndicator';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { useOptimisticUpdate } from '@/components/shared/useOptimisticUpdate';
import { sanitizeText, validateInput, rateLimiter, blockLinks, containsHarmfulContent } from '@/components/shared/InputSanitizer';
import { useInfinitePagination } from '@/components/shared/useInfinitePagination';
import { ChatSkeleton } from '@/components/shared/SkeletonLoader';
import SafetyCheckSetup from '@/components/safety/SafetyCheckSetup';
import VirtualList from '@/components/shared/VirtualList';
import OptimizedImage from '@/components/shared/OptimizedImage';
import { usePerformanceMonitor } from '@/components/shared/usePerformanceMonitor';
import { useRealtimeMessages } from '@/components/chat/useRealtimeMessages';
import TierGate, { hasAccess } from '@/components/shared/TierGate';
import MessageLimitPaywall from '@/components/paywall/MessageLimitPaywall';

import ReadReceipts from '@/components/chat/ReadReceipts';
import PremiumTypingIndicator from '@/components/chat/PremiumTypingIndicator';
import { useVerificationGate } from '@/hooks/useVerificationGate';
import VerificationGateBanner from '@/components/shared/VerificationGateBanner';
import { toast } from '@/hooks/use-toast';

export default function Chat() {
  usePerformanceMonitor('Chat');
  const navigate = useNavigate();
  
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');

  // Use matchId-specific keys so foreground refresh targets the right data
  useForegroundRefresh([['messages', matchId], ['match', matchId], ['conversations-data']]);
  
  const [myProfile, setMyProfile] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [recording, setRecording] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateLang, setTranslateLang] = useState('en');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showIceBreakers, setShowIceBreakers] = useState(false);
  const [showAIStarters, setShowAIStarters] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuestionGame, setShowQuestionGame] = useState(false);
  const [showVirtualGifts, setShowVirtualGifts] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showMessageLimitPaywall, setShowMessageLimitPaywall] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [showVideoCall, setShowVideoCall] = useState(false); // kept for state compat
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [translatingId, setTranslatingId] = useState(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();
  const { isGated: isVerificationGated, matchCount: gateMatchCount } = useVerificationGate(myProfile);

  // Real-time WebSocket connection
  const { 
    isConnected, 
    otherUserTyping, 
    sendTypingIndicator, 
    notifyNewMessage,
    sendReadReceipt 
  } = useRealtimeMessages(matchId, myProfile?.id, !!myProfile && !!matchId);

  // Screenshot detection note: Web browsers cannot reliably detect screenshots.
  // Native mobile apps can handle this, but web apps cannot.

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const user = await getCurrentUser();
        if (!user || !user.profile_id) {
          navigate('/landing');
          return;
        }
        // getCurrentUser already returns the full profile merged with auth
        setMyProfile({
          ...user,
          id: user.profile_id,
          user_id: user.id,
          display_name: user.display_name,
          primary_photo: user.primary_photo,
          photos: user.photos,
          subscription_tier: user.subscription_tier,
          is_banned: user.is_banned,
          blocked_users: user.blocked_users,
        });
      } catch (e) {
        console.error('Chat profile fetch error:', e);
        navigate('/landing');
      }
    };
    fetchProfiles();
  }, []);

  // Fetch match and other user's profile
  const { data: match, isError: matchError, isFetched: matchFetched } = useQuery({
    queryKey: ['match', matchId, myProfile?.id],
    queryFn: async () => {
      const matches = await filterRecords('matches', { id: matchId });
      if (matches.length > 0) {
        const m = matches[0];
        const myId = myProfile?.id || myProfile?.profile_id;
        const otherId = m.user1_id === myId ? m.user2_id : m.user1_id;
        const { data: otherProfiles } = await supabase
          .from('user_profiles')
          .select('id,user_id,display_name,primary_photo,photos,subscription_tier,current_city,current_country,country_of_origin,interests,opening_move,bio,blocked_users')
          .eq('id', otherId)
          .limit(1);
        if (otherProfiles?.length > 0) {
          setOtherProfile(otherProfiles[0]);
        }
        return m;
      }
      return null;
    },
    enabled: !!matchId && !!myProfile,
    staleTime: 120000,
    retry: 2,
    retryDelay: 2000
  });

  // Fetch messages with infinite scroll - OPTIMIZED
  const { 
    items: rawMessages, 
    loadMore: loadMoreMessages, 
    hasMore: hasMoreMessages,
    isLoadingMore: isLoadingMoreMessages,
    isLoading: messagesLoading 
  } = useInfinitePagination('messages', { match_id: matchId }, {
    pageSize: 30,
    sortBy: '-created_at',
    enabled: !!matchId,
    refetchInterval: false, // Disable auto-refetch, rely on WebSocket
    retry: 1,
    retryDelay: 5000,
    staleTime: 300000 // 5 minutes
  });

  const resolveMessageTimestamp = React.useCallback((message) => {
    return message?.created_at || message?.created_date || message?.updated_at || null;
  }, []);

  const formatMessageTime = React.useCallback((message) => {
    const timestamp = resolveMessageTimestamp(message);
    if (!timestamp) return '--:--';
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) return '--:--';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [resolveMessageTimestamp]);

  // Remove duplicates by ID and sort oldest first (newest at bottom)
  const messages = React.useMemo(() => {
    const seen = new Set();
    const unique = rawMessages.filter(msg => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });
    return unique.sort((a, b) => {
      const timeA = new Date(resolveMessageTimestamp(a) || 0).getTime();
      const timeB = new Date(resolveMessageTimestamp(b) || 0).getTime();
      return timeA - timeB;
    });
  }, [rawMessages, resolveMessageTimestamp]);

  // Scroll to bottom - optimized
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]); // Only trigger on message count change

  // Mark messages as read - optimized with batch update
  useEffect(() => {
    if (!matchId || !myProfile?.id) return;

    const loadedUnreadIds = messages
      .filter((m) => m.receiver_id === myProfile.id && !m.is_read)
      .map((m) => m.id);

    const readAt = new Date().toISOString();

    supabase
      .from('messages')
      .update({ is_read: true, read_at: readAt })
      .eq('match_id', matchId)
      .eq('receiver_id', myProfile.id)
      .eq('is_read', false)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to mark conversation messages as read:', error);
          return;
        }

        if (loadedUnreadIds.length > 0) {
          const unreadIdSet = new Set(loadedUnreadIds);

          queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
            if (!old) return old;

            if (Array.isArray(old)) {
              return old.map((message: any) =>
                unreadIdSet.has(message?.id)
                  ? { ...message, is_read: true, read_at: readAt }
                  : message
              );
            }

            if (!old?.pages || !Array.isArray(old.pages)) return old;

            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                items: (page?.items || []).map((message: any) =>
                  unreadIdSet.has(message?.id)
                    ? { ...message, is_read: true, read_at: readAt }
                    : message
                ),
              })),
            };
          });
        }

        queryClient.setQueriesData({ queryKey: ['conversations-data'] }, (old: any) => {
          if (!old || !matchId || !old[matchId]) return old;
          return {
            ...old,
            [matchId]: {
              ...old[matchId],
              unreadCount: 0,
            },
          };
        });

        if (myProfile?.id && matchId) {
          supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_profile_id', myProfile.id)
            .eq('type', 'message')
            .eq('is_read', false)
            .or(`link_to.ilike.%matchId=${matchId}%,link_to.ilike.%/chat/${matchId}%`)
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            });
        }

        queryClient.invalidateQueries({ queryKey: ['conversations-data'] });
        queryClient.invalidateQueries({ queryKey: ['bottom-nav-badges'] });
      });
  }, [messages.length, myProfile?.id, queryClient, matchId]); // Mark all unread in this conversation as soon as chat is opened/new message arrives

  // Send message with optimistic update
  const sendMessageMutation = useOptimisticUpdate(
    ['messages', matchId],
    async ({ content, type = 'text', mediaUrl = null }) => {
      // Client-side validation for better UX
      if (!validateInput.length(content, 1, 5000) && !mediaUrl) {
        throw new Error('Message must be between 1 and 5000 characters');
      }
      
      // Call secure backend function
      const response = await supabase.functions.invoke('send-message', {
        body: {
          matchId,
          content,
          type,
          mediaUrl
        }
      });

      // Handle backend errors
      if (response.error) {
        // Try to parse error body
        try {
          const errBody = typeof response.error.message === 'string' ? JSON.parse(response.error.message) : {};
          if (errBody.error === 'upgrade_required') {
            localStorage.setItem('message_limit_hit', 'true');
            throw new Error('upgrade_required');
          }
          throw new Error(errBody.error || response.error.message || 'Failed to send message');
        } catch (e) {
          if (e.message === 'upgrade_required') throw e;
          throw new Error(response.error.message || 'Failed to send message');
        }
      }

      const message = response.data;
      
      // Check for error in response data
      if (message?.error) {
        if (message.error === 'upgrade_required') {
          localStorage.setItem('message_limit_hit', 'true');
          throw new Error('upgrade_required');
        }
        throw new Error(message.error);
      }

      // Notify via WebSocket for immediate local echo
      notifyNewMessage(message);
      
      return message;
    }
  );

  // Handle message errors and success — reconcile optimistic messages safely
  useEffect(() => {
    if (sendMessageMutation.isError) {
      const error = sendMessageMutation.error;
      if (error.message === 'upgrade_required') {
        setShowMessageLimitPaywall(true);
      } else if (error.message.includes('too quickly')) {
        toast({ title: '⏱️ Please slow down - you can send up to 20 messages per minute.', variant: 'destructive' });
      } else {
        toast({ title: error.message, variant: 'destructive' });
      }
      // Remove only optimistic messages on error — real messages stay
      queryClient.setQueryData(['messages', matchId], (old: any[] = []) => 
        old.filter(m => !m.__optimistic)
      );
    }
    if (sendMessageMutation.isSuccess && sendMessageMutation.data) {
      const realMsg = sendMessageMutation.data;
      // Replace the optimistic message with the real one by matching content
      // This avoids the flash caused by remove-then-refetch
      queryClient.setQueryData(['messages', matchId], (old: any[] = []) => {
      // Find the optimistic message by its unique temp ID first, then fall back to content match
        const optimisticIdx = old.findIndex(
          m => m.__optimistic && m.__optimisticId === realMsg.__optimisticId
        );
        // If ID match fails (e.g. backend didn't echo it), try content+timestamp proximity
        const fallbackIdx = optimisticIdx >= 0 ? optimisticIdx : old.findIndex(
          m => m.__optimistic && m.content === realMsg.content && m.sender_id === realMsg.sender_id
        );
        const matchIdx = optimisticIdx >= 0 ? optimisticIdx : fallbackIdx;
        if (matchIdx >= 0) {
          // Swap the optimistic message for the real one
          const updated = [...old];
          updated[matchIdx] = { ...realMsg, created_date: realMsg.created_at };
          return updated;
        }
        // If no optimistic match found (websocket may have already delivered it),
        // just remove any remaining optimistic messages to avoid duplicates
        const withoutOptimistic = old.filter(m => !m.__optimistic);
        // Check if real message is already present from websocket
        const alreadyExists = withoutOptimistic.some(m => m.id === realMsg.id);
        if (!alreadyExists) {
          return [...withoutOptimistic, { ...realMsg, created_date: realMsg.created_at }];
        }
        return withoutOptimistic;
      });
    }
  }, [sendMessageMutation.isSuccess, sendMessageMutation.isError, sendMessageMutation.data, matchId, queryClient]);


  // Image mutation
  const sendImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await uploadFile(file);
      await sendMessageMutation.mutateAsync({ content: 'Image', type: 'image', mediaUrl: file_url });
    },
    onError: (err) => {
      console.error('Image upload error:', err);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    }
  });

  // Translation mutation
  const translateMessageMutation = useMutation({
    mutationFn: async ({ messageId, targetLang }) => {
      setTranslatingId(messageId);
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const translated = await invokeLLM({
        prompt: `Translate this message to ${targetLang}: "${message.content}". Return only the translation.`,
        response_json_schema: {
          type: "object",
          properties: {
            translation: { type: "string" }
          }
        }
      });

      await createRecord('message_translations', {
        message_id: messageId,
        original_language: 'unknown',
        translated_text: { [targetLang]: translated.translation }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', matchId]);
    },
    onSettled: () => {
      setTranslatingId(null);
    }
  });

  // Report mutation - uses backend edge function for proper validation
  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await invokeFunction('submitReport', {
        reported_id: otherProfile.id,
        report_type: 'harassment',
        description: reportReason,
      });
      if (response?.error) throw new Error(response.error);
    },
    onSuccess: () => {
      setShowReport(false);
      setReportReason('');
      toast({ title: 'Report submitted. Our team will review it.' });
    }
  });

  // Block user mutation - uses backend for proper validation
  const blockMutation = useMutation({
    mutationFn: async () => {
      const response = await invokeFunction('blockUser', {
        action: 'block',
        target_profile_id: otherProfile.id,
        match_id: match?.id,
      });
      if (response?.error) throw new Error(response.error);
    },
    onSuccess: () => {
      navigate('/matches');
    }
  });


  const handleVirtualGifts = () => {
    const tier = myProfile?.subscription_tier;
    if (tier === 'elite' || tier === 'vip') {
      setShowVirtualGifts(true);
    } else {
      setUpgradeFeature('Virtual Gifts');
      setShowUpgradePrompt(true);
    }
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    if (isVerificationGated) return;
    // Prevent duplicate sends
    if (sendMessageMutation.isPending) return;

    // Clear input immediately for better UX
    const textToSend = messageText.trim();
    setMessageText('');

    // Create optimistic message with unique temp ID
    const optimisticId = `temp-${Date.now()}-${Math.random()}`;
    const cid = generateCorrelationId('msg_send');
    logMutation('message_send', cid, 'info', { profile_id: myProfile.id, metadata: { matchId, optimisticId } });

    const optimisticMessage = {
      id: optimisticId,
      __optimisticId: optimisticId,
      match_id: matchId,
      sender_id: myProfile.id,
      receiver_id: otherProfile.id,
      content: textToSend,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      created_date: new Date().toISOString(),
      __optimistic: true
    };

    // Update messages immediately (optimistic)
    queryClient.setQueryData(['messages', matchId], (old = []) => [...old, optimisticMessage]);

    sendMessageMutation.mutate({ 
      content: textToSend,
      __optimisticId: optimisticId
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      sendImageMutation.mutate(file);
    }
  };

  // Typing indicator handler
  const handleTyping = () => {
    sendTypingIndicator(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  };

  const generateSmartReply = async () => {
    const lastMessage = messages.find(m => m.sender_id === otherProfile.id);
    if (!lastMessage) return;

    setIsGeneratingReply(true);
    try {
      const res = await invokeLLM({
        prompt: `
          Generate 3 short, flirty or engaging reply options to this message: "${lastMessage.content}".
          Context: Dating app chat. Keep it casual and fun.
          Return strictly valid JSON: { "options": ["option1", "option2", "option3"] }
        `,
        response_json_schema: {
          type: "object",
          properties: {
            options: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      if (res.options && res.options.length > 0) {
        setMessageText(res.options[0]);
      }
    } catch (e) {
      console.error("Smart reply failed", e);
      toast({ title: "Could not generate a reply at this time. Please try again.", variant: 'destructive' });
    } finally {
      setIsGeneratingReply(false);
    }
  };

  if (!otherProfile) {
    const showError = (matchFetched && !match) || matchError;
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Matches')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="h-6 bg-muted rounded animate-pulse w-32" />
        </header>
        {showError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-muted-foreground mb-4">This conversation could not be loaded.</p>
            <Link to={createPageUrl('Matches')}>
              <Button variant="outline">Back to Matches</Button>
            </Link>
          </div>
        ) : (
          <>
            <ChatSkeleton />
            {!myProfile && (
              <div className="text-center p-4 text-muted-foreground text-sm">
                Loading your profile...
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Native App Bar */}
      <header className="bg-card/95 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Matches')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <Avatar>
            <AvatarImage src={otherProfile.primary_photo || otherProfile.photos?.[0]} />
            <AvatarFallback>{otherProfile.display_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{otherProfile.display_name}</h2>
            <p className="text-xs text-muted-foreground">
              {otherProfile?.last_active && (Date.now() - new Date(otherProfile.last_active).getTime()) < 10 * 60 * 1000
                ? 'Active now'
                : otherProfile?.last_active
                  ? `Last active ${(() => { const mins = Math.floor((Date.now() - new Date(otherProfile.last_active).getTime()) / 60000); if (mins < 60) return mins + 'm ago'; const hrs = Math.floor(mins / 60); if (hrs < 24) return hrs + 'h ago'; return Math.floor(hrs / 24) + 'd ago'; })()}`
                  : ''
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`VirtualGifts?profileId=${otherProfile.id}`)}>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              title="Send Gift (Elite/VIP)"
            >
              <Gift size={20} />
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`SafetyCheckSetup?matchId=${matchId}`)}>
                <Shield size={16} className="mr-2" />
                Set Up Safety Check
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl(`Report?userId=${otherProfile.id}`)}>
                <Flag size={16} className="mr-2" />
                Report User
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowBlockConfirm(true)} 
              className="text-destructive"
            >
              <Ban size={16} className="mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
          </div>
          </header>

      {/* Messages - optimized rendering */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" id="messages-container">
        {hasMoreMessages && !isLoadingMoreMessages && (
          <div className="text-center py-2">
            <button
              onClick={loadMoreMessages}
              className="text-sm text-primary hover:underline"
            >
              Load older messages
            </button>
          </div>
        )}

        {isLoadingMoreMessages && (
          <div className="text-center py-2">
            <div className="animate-spin inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {messages.length === 0 && !messagesLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {/* Opening Move prompt */}
            {otherProfile.opening_move ? (
              <>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{otherProfile.display_name}'s Opening Move</h3>
                <div className="bg-accent/50 border border-accent rounded-2xl px-5 py-4 mb-4 max-w-xs">
                  <p className="text-foreground text-sm italic">"{otherProfile.opening_move}"</p>
                </div>
                <p className="text-muted-foreground text-xs mb-4">Answer their prompt to start the conversation!</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Start a Conversation!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Say hello to {otherProfile.display_name}
                </p>
              </>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAIStarters(true)}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Sparkles size={16} className="mr-2" />
                AI Suggestions
              </Button>
              <Button
                onClick={() => setShowIceBreakers(true)}
                variant="outline"
              >
                Ice Breakers
              </Button>
            </div>
          </div>
        )}
        
        {messages.map(msg => {
          const isMine = msg.sender_id === myProfile?.id;
          const isOptimistic = msg.__optimistic;

          return (
            <div 
              key={msg.id} 
              className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isOptimistic ? 'opacity-60' : ''}`}
            >
              {/* Other user's avatar */}
              {!isMine && (
                <img 
                  src={otherProfile?.primary_photo || otherProfile?.photos?.[0]} 
                  alt="" 
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              )}
              
              <div className={`max-w-xs md:max-w-md ${
                isMine 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              } rounded-2xl ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} px-4 py-2.5 shadow-sm transition-opacity duration-200`}>
                {msg.message_type === 'voice_note' ? (
                  <audio controls src={msg.media_url} className="w-full" preload="metadata" />
                ) : msg.message_type === 'image' ? (
                  <OptimizedImage src={msg.media_url} alt="Shared" className="rounded-lg max-w-full" />
                ) : (
                  <p className="text-sm break-words">{msg.content}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-xs ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {formatMessageTime(msg)}
                  </p>
                  {isMine && (
                    <ReadReceipts 
                      message={msg} 
                      isPremium={myProfile?.subscription_tier === 'premium' || myProfile?.subscription_tier === 'elite' || myProfile?.subscription_tier === 'vip'}
                    />
                  )}
                </div>
              </div>

              {/* My avatar */}
              {isMine && (
                <img 
                  src={myProfile?.primary_photo || myProfile?.photos?.[0]} 
                  alt="" 
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              )}
            </div>
          );
        })}

        {/* Premium Typing Indicator */}
        <PremiumTypingIndicator 
          isTyping={otherUserTyping}
          displayName={otherProfile.display_name}
          isPremium={myProfile?.subscription_tier === 'premium' || myProfile?.subscription_tier === 'elite' || myProfile?.subscription_tier === 'vip'}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* AI Conversation Helper - Only show if no messages yet or conversation is stale */}
      {myProfile && otherProfile && messages.length < 5 && (
        <AIConversationHelper
          matchId={matchId}
          myProfileId={myProfile.id}
          theirProfile={otherProfile}
          lastMessage={messages.find(m => m.sender_id === otherProfile?.id)?.content}
          onSelectMessage={(msg) => setMessageText(msg)}
          isNewMatch={messages.length === 0}
        />
      )}

      {isVerificationGated && <VerificationGateBanner matchCount={gateMatchCount} />}

      {/* Input - Native Keyboard Optimized */}
      <div className="bg-card border-t border-border px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={generateSmartReply}
            disabled={isGeneratingReply}
            title="Magic Reply"
            className={isGeneratingReply ? "animate-pulse" : ""}
          >
            <Wand2 size={20} className="text-accent" />
          </Button>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            onClick={(e) => { e.target.value = null; }}
            className="hidden"
            id="image-input"
          />
          <label htmlFor="image-input">
            <Button variant="ghost" size="icon" asChild disabled={sendImageMutation.isPending}>
              <span>
                {sendImageMutation.isPending ? (
                  <Loader2 className="animate-spin text-primary" size={20} />
                ) : (
                  <Image size={20} />
                )}
              </span>
            </Button>
          </label>
          


          <AutoResizeTextarea
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 py-3"
            minHeight={44}
            maxHeight={120}
          />

          <Button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              handleSend();
            }}
            disabled={!messageText.trim() || sendMessageMutation.isPending || isVerificationGated}
            className="bg-primary hover:bg-primary/90 active:bg-primary/80 h-11 w-11 p-0 rounded-full touch-manipulation transition-all active:scale-95"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please describe why you're reporting {otherProfile.display_name}
            </p>
            <Textarea
              placeholder="Describe the issue..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
            />
            <Button
              onClick={() => reportMutation.mutate()}
              disabled={!reportReason || reportMutation.isPending}
              className="w-full bg-destructive hover:bg-destructive/90"
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </DialogContent>
        </Dialog>

        {/* Ice Breaker Prompts */}
        <AnimatePresence>
        {showIceBreakers && (
          <IceBreakerPrompts
            onSelectQuestion={(q) => setMessageText(q)}
            onClose={() => setShowIceBreakers(false)}
          />
        )}
        </AnimatePresence>

        {/* AI Conversation Starters */}
        <AnimatePresence>
        {showAIStarters && myProfile && otherProfile && (
          <AIConversationStarters
            myProfile={myProfile}
            otherProfile={otherProfile}
            matchId={matchId}
            onSelectQuestion={(q) => setMessageText(q)}
            onClose={() => setShowAIStarters(false)}
          />
        )}
        </AnimatePresence>

        {/* Virtual Gifts Modal */}
        {showVirtualGifts && (
          <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowVirtualGifts(false)}>
            <div className="bg-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">Send a Virtual Gift 🎁</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {['🌹', '💎', '🍫', '🎂', '💐', '🎁', '⭐', '💝', '👑'].map((gift, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sendMessageMutation.mutate({ content: `Sent you a gift ${gift}`, type: 'text' });
                      setShowVirtualGifts(false);
                    }}
                    className="p-6 text-4xl bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl hover:scale-110 transition"
                  >
                    {gift}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setShowVirtualGifts(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Message Limit Paywall */}
        <AnimatePresence>
          {showMessageLimitPaywall && (
            <MessageLimitPaywall onClose={() => setShowMessageLimitPaywall(false)} />
          )}
        </AnimatePresence>

        {/* Upgrade Prompt Modal */}
        {showUpgradePrompt && (
          <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowUpgradePrompt(false)}>
            <div className="bg-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Sparkles size={40} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{upgradeFeature} are Exclusive!</h2>
                <p className="text-muted-foreground mb-6">
                  Upgrade to Elite or VIP to unlock {upgradeFeature.toLowerCase()} and connect in new ways!
                </p>
                <div className="space-y-3">
                  <Link to={createPageUrl('PricingPlans')}>
                    <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      Upgrade Now
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setShowUpgradePrompt(false)} className="w-full">
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Block User Confirmation */}
        <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block {otherProfile?.display_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                They won't be able to see your profile or contact you. This action can be undone later from Settings → Blocked Users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {blockMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Blocking...
                  </>
                ) : (
                  'Block User'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        </div>
        );
        }