// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Calendar, Users, Crown, ChevronRight, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

export default function VIPEventsPromo({ userProfile, nextEvent }) {
  const tier = userProfile?.subscription_tier || 'free';
  const hasAccess = tier === 'elite' || tier === 'vip';

  if (!nextEvent) return null;

  const eventTypeEmoji = { speed_dating: '💕', mixer: '🎉', workshop: '📚', exclusive_party: '✨', webinar: '🎥' };

  if (!hasAccess) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 rounded-2xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-card/20 rounded-xl flex items-center justify-center flex-shrink-0"><Lock size={24} className="text-primary-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-purple-200 uppercase tracking-wide font-semibold">VIP Exclusive</p>
              <h3 className="text-primary-foreground font-bold truncate">{eventTypeEmoji[nextEvent.event_type]} {nextEvent.title}</h3>
              <p className="text-sm text-purple-200">{format(new Date(nextEvent.scheduled_at), 'MMM d')} • {nextEvent.current_participants || 0} attending</p>
            </div>
            <Link to={createPageUrl('PricingPlans')}><Button size="sm" className="bg-background text-purple-900 hover:bg-muted flex-shrink-0"><Crown size={14} className="mr-1" /> Unlock</Button></Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <Link to={createPageUrl('VIPEventsHub')}>
        <div className="bg-gradient-to-r from-primary to-pink-600 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-card/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">{eventTypeEmoji[nextEvent.event_type]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge className="bg-card/20 text-primary-foreground text-[10px] capitalize">{nextEvent.event_type?.replace('_', ' ')}</Badge>
                {tier === 'vip' && <Badge className="bg-amber-500 text-primary-foreground text-[10px]"><Crown size={10} className="mr-0.5" /> VIP</Badge>}
              </div>
              <h3 className="text-primary-foreground font-bold truncate">{nextEvent.title}</h3>
              <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <span className="flex items-center gap-1"><Calendar size={12} />{format(new Date(nextEvent.scheduled_at), 'MMM d, h:mm a')}</span>
                <span className="flex items-center gap-1"><Users size={12} />{nextEvent.current_participants || 0}/{nextEvent.max_participants}</span>
              </div>
            </div>
            <ChevronRight size={24} className="text-primary-foreground/70 flex-shrink-0" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
