// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AIConversationHelperProps {
  matchId: string;
  myProfileId: string;
  theirProfile: any;
  lastMessage?: string;
  onSelectMessage?: (message: string) => void;
  isNewMatch?: boolean;
}

export default function AIConversationHelper({ 
  matchId, 
  myProfileId, 
  theirProfile,
  lastMessage,
  onSelectMessage,
  isNewMatch = false 
}: AIConversationHelperProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(isNewMatch);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isNewMatch && theirProfile?.id && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isNewMatch, theirProfile?.id]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      // Get my profile data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from('user_profiles')
        .select('display_name, bio, interests')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke('chat-suggestions', {
        body: {
          matchId,
          myProfile: myProfile || {},
          otherProfile: theirProfile || {},
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMessage = (message: string) => {
    onSelectMessage?.(message);
    setIsExpanded(false);
  };

  return (
    <div className="border-t border-border bg-gradient-to-r from-primary/5 to-accent/5">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-sm font-medium text-primary">AI Conversation Helper</span>
          {isNewMatch && suggestions.length === 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs">New!</Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-primary" />
        ) : (
          <ChevronUp size={16} className="text-primary" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
                </div>
              )}

              {/* Suggestions */}
              {!isLoading && (
                <div className="space-y-2">
                  {suggestions.length === 0 ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={fetchSuggestions}
                    >
                      <Sparkles size={14} className="mr-2" />
                      Generate personalized starters
                    </Button>
                  ) : (
                    <>
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectMessage(suggestion)}
                          className="w-full text-left p-3 bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground">{suggestion}</p>
                            <Send size={14} className="text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                          </div>
                        </button>
                      ))}
                      <Button
                        onClick={() => {
                          setSuggestions([]);
                          fetchSuggestions();
                        }}
                        variant="outline"
                        className="w-full mt-2"
                        disabled={isLoading}
                      >
                        <Sparkles size={14} className="mr-2" />
                        Refresh Suggestions
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}