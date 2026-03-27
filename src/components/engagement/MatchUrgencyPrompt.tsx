// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

interface MatchUrgencyPromptProps {
  unmessagedMatches: any[];
  conversationData: Record<string, any>;
}

function getUrgencyLevel(match: any) {
  const matchedAt = new Date(match.matched_at || match.created_date);
  const hoursAgo = (Date.now() - matchedAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 2) return { level: 'hot', text: 'Say hi now — they\'re online 🔥', icon: Zap, color: 'text-amber-500 bg-amber-50 border-amber-200' };
  if (hoursAgo < 12) return { level: 'warm', text: 'They\'re waiting for your message…', icon: MessageCircle, color: 'text-primary bg-primary/5 border-primary/20' };
  return { level: 'urgent', text: 'Don\'t miss this connection — expires soon ⏳', icon: Clock, color: 'text-destructive bg-destructive/5 border-destructive/20' };
}

export default function MatchUrgencyPrompt({ unmessagedMatches, conversationData }: MatchUrgencyPromptProps) {
  // Only show for matches with no messages
  const urgent = unmessagedMatches
    .filter(p => !conversationData[p.match?.id]?.lastMessage)
    .slice(0, 2);

  if (urgent.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {urgent.map(profile => {
        const urgency = getUrgencyLevel(profile.match);
        const Icon = urgency.icon;
        return (
          <Link key={profile.id} to={createPageUrl(`Chat?matchId=${profile.match?.id}`)}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${urgency.color} transition-all hover:shadow-sm`}
            >
              <img
                src={profile.primary_photo || profile.photos?.[0]}
                alt=""
                className="w-10 h-10 rounded-full object-cover border-2 border-background"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile.display_name?.split(' ')[0]}
                </p>
                <p className="text-xs opacity-80 flex items-center gap-1">
                  <Icon size={12} />
                  {urgency.text}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <MessageCircle size={14} className="text-primary-foreground" />
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}
