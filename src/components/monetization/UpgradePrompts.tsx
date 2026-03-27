// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useConversionTracker, CONVERSION_EVENTS } from '@/components/shared/ConversionTracker';

export function useUpgradePrompts(userProfile) {
  const [prompt, setPrompt] = useState(null);
  const { trackEvent } = useConversionTracker();
  const trackEventRef = React.useRef(trackEvent);
  trackEventRef.current = trackEvent;

  useEffect(() => {
    if (!userProfile || userProfile.subscription_tier !== 'free') return;
    const triggers = {
      likes_limit: () => {
        if ((userProfile.daily_likes_count || 0) >= 8) return { icon: Crown, title: 'Running low on likes!', description: 'Get unlimited likes with Premium', feature: 'unlimited_likes' };
      },
      who_likes_you: () => {
        if (localStorage.getItem('visited_who_likes') && !localStorage.getItem('upgrade_prompt_shown_who_likes')) {
          localStorage.setItem('upgrade_prompt_shown_who_likes', 'true');
          return { icon: Eye, title: 'See who likes you!', description: 'Upgrade to see everyone who swiped right on you', feature: 'see_likes' };
        }
      },
      message_limit: () => {
        if (localStorage.getItem('message_limit_hit') && !localStorage.getItem('upgrade_prompt_shown_messages')) {
          localStorage.setItem('upgrade_prompt_shown_messages', 'true');
          return { icon: MessageCircle, title: 'Keep the conversation going!', description: 'Get unlimited messaging with Premium', feature: 'unlimited_messages' };
        }
      }
    };
    for (const [key, trigger] of Object.entries(triggers)) {
      const result = trigger();
      if (result) { setPrompt(result); trackEventRef.current('upgrade_prompt_shown', { trigger: key }); break; }
    }
  }, [userProfile?.subscription_tier, userProfile?.daily_likes_count]);

  return { prompt, dismissPrompt: () => setPrompt(null) };
}

export function UpgradePromptBanner({ prompt, onDismiss }) {
  const { trackEvent } = useConversionTracker();
  if (!prompt) return null;
  const Icon = prompt.icon;

  return (
    <AnimatePresence>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40">
        <div className="bg-gradient-to-br from-primary to-amber-600 rounded-2xl p-5 shadow-2xl text-primary-foreground relative">
          <button onClick={onDismiss} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition"><X size={18} /></button>
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg"><Icon size={24} /></div>
            <div><h4 className="font-bold text-lg">{prompt.title}</h4><p className="text-sm opacity-90">{prompt.description}</p></div>
          </div>
          <Link to={createPageUrl('PricingPlans')}>
            <Button className="w-full bg-background text-primary hover:bg-muted" onClick={() => trackEvent(CONVERSION_EVENTS.PREMIUM_CLICK, { source: 'upgrade_prompt', feature: prompt.feature })}>
              <Zap size={16} className="mr-2" /> Upgrade Now
            </Button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
