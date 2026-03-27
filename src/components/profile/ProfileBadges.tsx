// @ts-nocheck
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Flame, Sparkles, Star, TrendingUp } from 'lucide-react';

const BADGE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  recently_active: { label: 'Recently Active', icon: Flame, color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400' },
  popular: { label: 'Popular', icon: TrendingUp, color: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950/30 dark:text-pink-400' },
  new_here: { label: 'New Here', icon: Sparkles, color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400' },
  top_pick: { label: 'Top Pick', icon: Star, color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400' },
  highly_liked: { label: 'Highly Liked', icon: Flame, color: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/30 dark:text-rose-400' },
  active_member: { label: 'Active Member', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400' },
};

export function computeBadges(profile: any): string[] {
  const badges: string[] = [];
  if (!profile) return badges;
  const now = Date.now();
  const lastActive = profile.last_active ? new Date(profile.last_active).getTime() : 0;
  if (now - lastActive < 24 * 60 * 60 * 1000) badges.push('recently_active');
  const createdAt = profile.created_at || profile.created_date;
  if (createdAt && now - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000) badges.push('new_here');
  if (profile.is_verified && profile.profile_completion >= 80) badges.push('top_pick');
  if (profile.login_streak >= 7) badges.push('active_member');
  return badges;
}

export default function ProfileBadges({ badges = [] }: { badges?: string[] }) {
  if (!badges || badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map(badgeKey => {
        const config = BADGE_CONFIG[badgeKey];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <Badge key={badgeKey} className={`${config.color} flex items-center gap-1`}>
            <Icon size={12} />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}
