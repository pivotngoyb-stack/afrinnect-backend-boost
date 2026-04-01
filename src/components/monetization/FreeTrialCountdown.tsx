import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface FreeTrialCountdownProps {
  userProfileId: string;
}

export default function FreeTrialCountdown({ userProfileId }: FreeTrialCountdownProps) {
  const [trialEnd, setTrialEnd] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!userProfileId) return;

    const fetchTrial = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('trial_end, is_trial, status')
        .eq('user_profile_id', userProfileId)
        .eq('is_trial', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].trial_end) {
        setTrialEnd(new Date(data[0].trial_end));
      }
    };

    fetchTrial();
  }, [userProfileId]);

  useEffect(() => {
    if (!trialEnd) return;

    const tick = () => {
      const now = Date.now();
      const diff = trialEnd.getTime() - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
        return false;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours >= 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h left`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
      return true;
    };

    if (!tick()) return;
    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [trialEnd]);

  if (!trialEnd) return null;

  if (expired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-destructive text-destructive-foreground rounded-xl p-4 flex items-center gap-3"
      >
        <Clock size={20} />
        <div className="flex-1">
          <p className="font-semibold text-sm">Your free trial has ended</p>
          <p className="text-xs opacity-90">Upgrade to keep your premium features</p>
        </div>
        <Link to={createPageUrl('PricingPlans')}>
          <Button size="sm" variant="secondary" className="text-xs">
            <Crown size={12} className="mr-1" />
            Upgrade
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center flex-shrink-0">
        <Sparkles size={18} className="text-primary-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">Premium Trial Active</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} />
          <span>{timeLeft}</span>
        </div>
      </div>
    </motion.div>
  );
}
