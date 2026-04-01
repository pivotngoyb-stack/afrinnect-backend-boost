// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, Heart, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * LiveActivityFeed — shows REAL platform stats, not fabricated activity.
 * Queries actual aggregate counts and displays factual summaries.
 */

export default function LiveActivityFeed({ className = '', userProfile }: { className?: string; userProfile?: any }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<{ totalUsers: number; recentMatches: number } | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get real aggregate stats (no personal data exposed)
        const [usersRes, matchesRes] = await Promise.all([
          supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
          supabase.from('matches').select('id', { count: 'exact', head: true })
            .eq('is_match', true)
            .gte('matched_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          recentMatches: matchesRes.count || 0,
        });
      } catch {
        // Don't show anything if we can't get real data
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  if (!stats || (stats.totalUsers === 0 && stats.recentMatches === 0)) return null;

  const items = [
    stats.totalUsers > 0 && {
      icon: Users,
      text: `${stats.totalUsers.toLocaleString()} members on Afrinnect`,
      color: 'text-primary',
    },
    stats.recentMatches > 0 && {
      icon: Heart,
      text: `${stats.recentMatches.toLocaleString()} matches made this week`,
      color: 'text-pink-500',
    },
  ].filter(Boolean);

  if (items.length === 0) return null;

  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx(prev => (prev + 1) % items.length);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, [items.length]);

  const current = items[currentIdx % items.length];
  if (!current) return null;
  const Icon = current.icon;

  return (
    <div className={`mb-3 ${className}`}>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={current.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
          >
            <Icon size={14} className={current.color} />
            <p className="text-xs text-muted-foreground">{current.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
