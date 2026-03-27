// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const STARTERS = [
  "What's something that always makes you smile?",
  "Tell me about your favorite place in the world",
  "What's your go-to weekend plan?",
  "If you could travel anywhere right now, where?",
];

interface ChatReminderBannerProps {
  staleConversations: any[];
  conversationData: Record<string, any>;
}

export default function ChatReminderBanner({ staleConversations, conversationData }: ChatReminderBannerProps) {
  // Filter conversations where last message > 24h ago
  const stale = staleConversations.filter(p => {
    const conv = conversationData[p.match?.id];
    if (!conv?.lastMessage) return false;
    const lastMsgTime = new Date(conv.lastMessage.created_date || conv.lastMessage.created_at).getTime();
    return Date.now() - lastMsgTime > 24 * 60 * 60 * 1000;
  }).slice(0, 1);

  if (stale.length === 0) return null;
  const profile = stale[0];
  const starter = STARTERS[Math.floor(Math.random() * STARTERS.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Link to={createPageUrl(`Chat?matchId=${profile.match?.id}`)}>
        <div className="flex items-center gap-3 bg-accent/50 border border-accent rounded-xl px-4 py-3 hover:bg-accent/70 transition-colors">
          <img
            src={profile.primary_photo || profile.photos?.[0]}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Your chat with {profile.display_name?.split(' ')[0]} is going quiet 💬
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              Try: "{starter}"
            </p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
