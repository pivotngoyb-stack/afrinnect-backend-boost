import React, { forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';

// Contextual nudge generators based on shared profile data
function generateContextualNudge(myProfile: any, otherProfile: any, language: string): string {
  const nudges: string[] = [];

  // Interest-based nudges
  const myInterests = Array.isArray(myProfile?.interests) ? myProfile.interests : [];
  const theirInterests = Array.isArray(otherProfile?.interests) ? otherProfile.interests : [];
  const shared = myInterests.filter((i: string) => theirInterests.includes(i));

  if (shared.length > 0) {
    const interest = shared[Math.floor(Math.random() * shared.length)];
    nudges.push(
      language === 'fr'
        ? `Vous aimez tous les deux "${interest}" — demandez-lui ce qu'il/elle en pense !`
        : `You both like "${interest}" — ask about it! 🎯`
    );
  }

  // Origin-based nudge
  if (otherProfile?.country_of_origin) {
    nudges.push(
      language === 'fr'
        ? `Demandez-lui ce qui lui manque de ${otherProfile.country_of_origin} 🌍`
        : `Ask what they miss about ${otherProfile.country_of_origin} 🌍`
    );
  }

  // Opening move nudge
  if (otherProfile?.opening_move) {
    nudges.push(
      language === 'fr'
        ? `Répondez à leur question: "${otherProfile.opening_move}"`
        : `Answer their prompt: "${otherProfile.opening_move}"`
    );
  }

  // Fallback generic nudges
  const fallbacks = language === 'fr'
    ? ["Qu'est-ce qui vous fait toujours sourire ?", "Parlez-moi de votre endroit préféré"]
    : ["What's something that always makes you smile?", "Where would you travel next?"];

  if (nudges.length === 0) {
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  return nudges[Math.floor(Math.random() * nudges.length)];
}

interface ChatReminderBannerProps {
  staleConversations: any[];
  conversationData: Record<string, any>;
  myProfile?: any;
}

const ChatReminderBanner = forwardRef<HTMLDivElement, ChatReminderBannerProps>(({ staleConversations, conversationData, myProfile }, ref) => {
  const { t, language } = useLanguage() as any;

  const stale = useMemo(() => staleConversations.filter(p => {
    const conv = conversationData[p.match?.id];
    if (!conv?.lastMessage) return false;
    const lastMsgTime = new Date(conv.lastMessage.created_date || conv.lastMessage.created_at).getTime();
    return Date.now() - lastMsgTime > 24 * 60 * 60 * 1000;
  }).slice(0, 1), [staleConversations, conversationData]);

  if (stale.length === 0) return null;
  const profile = stale[0];
  const nudge = useMemo(() => generateContextualNudge(myProfile, profile, language), [myProfile, profile, language]);

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
            <p className="text-sm font-medium text-foreground flex items-center gap-1">
              <Sparkles size={12} className="text-primary" />
              {t('engagement.chatReminder').replace('{name}', profile.display_name?.split(' ')[0] || '')}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {nudge}
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
