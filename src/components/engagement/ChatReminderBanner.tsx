import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';

const STARTERS_EN = [
  "What's something that always makes you smile?",
  "Tell me about your favorite place in the world",
  "What's your go-to weekend plan?",
  "If you could travel anywhere right now, where?",
];

const STARTERS_FR = [
  "Qu'est-ce qui vous fait toujours sourire ?",
  "Parlez-moi de votre endroit préféré au monde",
  "Quel est votre programme de week-end idéal ?",
  "Si vous pouviez voyager n'importe où maintenant, où iriez-vous ?",
];

interface ChatReminderBannerProps {
  staleConversations: any[];
  conversationData: Record<string, any>;
}

const ChatReminderBanner = forwardRef<HTMLDivElement, ChatReminderBannerProps>(({ staleConversations, conversationData }, ref) => {
  const { t, language } = useLanguage();
  const starters = language === 'fr' ? STARTERS_FR : STARTERS_EN;

  const stale = staleConversations.filter(p => {
    const conv = conversationData[p.match?.id];
    if (!conv?.lastMessage) return false;
    const lastMsgTime = new Date(conv.lastMessage.created_date || conv.lastMessage.created_at).getTime();
    return Date.now() - lastMsgTime > 24 * 60 * 60 * 1000;
  }).slice(0, 1);

  if (stale.length === 0) return null;
  const profile = stale[0];
  const starter = starters[Math.floor(Math.random() * starters.length)];

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
              {t('engagement.chatReminder').replace('{name}', profile.display_name?.split(' ')[0] || '')}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {t('engagement.chatReminderTry')} "{starter}"
            </p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
});

ChatReminderBanner.displayName = 'ChatReminderBanner';

export default ChatReminderBanner;
