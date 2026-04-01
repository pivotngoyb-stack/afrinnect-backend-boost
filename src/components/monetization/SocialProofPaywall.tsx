import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SocialProofPaywallProps {
  className?: string;
}

export default function SocialProofPaywall({ className = "" }: SocialProofPaywallProps) {
  const [stats, setStats] = useState<{ upgrades7d: number; totalPremium: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Count recent upgrades (subscriptions created in last 7 days)
      const { count: recentUpgrades } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo)
        .eq('status', 'active');

      // Count total premium users
      const { count: totalPremium } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .in('subscription_tier', ['premium', 'elite', 'vip']);

      setStats({
        upgrades7d: recentUpgrades || 0,
        totalPremium: totalPremium || 0,
      });
    };

    fetchStats();
  }, []);

  // Don't render if we have no meaningful stats
  if (!stats || (stats.upgrades7d === 0 && stats.totalPremium === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-2 ${className}`}
    >
      {stats.totalPremium > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={14} className="text-primary" />
          <span>
            <strong className="text-foreground">{stats.totalPremium.toLocaleString()}</strong> members upgraded
          </span>
        </div>
      )}

      {stats.upgrades7d > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp size={14} className="text-green-500" />
          <span>
            <strong className="text-foreground">{stats.upgrades7d}</strong> upgraded this week
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck size={14} className="text-blue-500" />
        <span>Cancel anytime · No commitments</span>
      </div>
    </motion.div>
  );
}
