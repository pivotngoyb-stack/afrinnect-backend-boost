// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Tier requirements for features - Production tier matrix
export const TIER_FEATURES = {
  limited_likes: ['premium'],
  see_who_liked: ['premium', 'elite', 'vip'],
  limited_messaging: ['premium'],
  advanced_filters: ['premium', 'elite', 'vip'],
  profile_boost: ['premium', 'elite', 'vip'],
  read_receipts: ['premium', 'elite', 'vip'],
  limited_rewind: ['premium'],
  priority_likes: ['premium', 'elite', 'vip'],
  unlimited_likes: ['elite', 'vip'],
  unlimited_messaging: ['elite', 'vip'],
  rewind: ['elite', 'vip'],
  virtual_gifts: ['elite', 'vip'],
  unlimited_boosts: ['elite', 'vip'],
  priority_ranking: ['elite', 'vip'],
  incognito_mode: ['elite', 'vip'],
  verified_badge: ['elite', 'vip'],
  super_likes_daily: ['elite', 'vip'],
  featured_profile: ['vip'],
  profile_insights: ['vip'],
  concierge_support: ['vip'],
  priority_support: ['vip'],
  exclusive_events: ['vip'],
  dedicated_matchmaker: ['vip'],
  virtual_speed_dating: ['vip']
};

export const TIER_LIMITS = {
  premium: { daily_likes: 50, daily_messages: 100, daily_rewinds: 5 },
  elite: { daily_likes: Infinity, daily_messages: Infinity, daily_rewinds: Infinity },
  vip: { daily_likes: Infinity, daily_messages: Infinity, daily_rewinds: Infinity }
};

const TIER_HIERARCHY: Record<string, number> = {
  free: 0, premium: 1, elite: 2, vip: 3
};

const TIER_NAMES: Record<string, string> = {
  premium: 'Premium', elite: 'Elite', vip: 'VIP Matchmaker'
};

export function hasAccess(userTier: string, feature: string) {
  const tier = userTier || 'free';
  const requiredTiers = TIER_FEATURES[feature] || [];
  return requiredTiers.includes(tier);
}

interface TierGateProps {
  currentTier?: string;
  userTier?: string;
  requiredTier?: string;
  requiredFeature?: string;
  children: React.ReactNode;
  showUpgrade?: boolean;
  showUpgradePrompt?: boolean;
  fallback?: React.ReactNode;
}

export default function TierGate({
  currentTier,
  userTier,
  requiredTier,
  requiredFeature,
  children,
  showUpgrade = true,
  showUpgradePrompt = true,
  fallback = null
}: TierGateProps) {
  const [showDialog, setShowDialog] = React.useState(false);
  const tier = userTier || currentTier || 'free';

  // Feature-based access check
  if (requiredFeature) {
    const access = hasAccess(tier, requiredFeature);
    if (access) return <>{children}</>;

    if (!showUpgradePrompt && !showUpgrade) return <>{fallback}</>;

    const requiredTiers = TIER_FEATURES[requiredFeature] || [];
    const lowestTier = requiredTiers[0] || 'premium';
    const tierName = lowestTier.charAt(0).toUpperCase() + lowestTier.slice(1);

    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-purple-50">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Crown size={32} className="text-primary-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">Premium Feature</h3>
          <p className="text-muted-foreground mb-4">
            Upgrade to {tierName} to unlock this feature
          </p>
          <Link to={createPageUrl('PricingPlans')}>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Crown size={18} className="mr-2" />
              Upgrade Now
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Tier-hierarchy based access check (legacy)
  if (requiredTier) {
    const hasHierarchyAccess = TIER_HIERARCHY[tier] >= TIER_HIERARCHY[requiredTier];
    if (hasHierarchyAccess) return <>{children}</>;

    if (!showUpgrade) return <>{fallback}</>;

    return (
      <>
        <div className="relative">
          <div className="opacity-50 pointer-events-none blur-sm">
            {fallback || children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-accent to-amber-600 shadow-xl"
            >
              <Crown size={16} className="mr-2" />
              Upgrade to {TIER_NAMES[requiredTier]}
            </Button>
          </div>
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock size={20} className="text-accent" />
                {TIER_NAMES[requiredTier]} Feature
              </DialogTitle>
              <DialogDescription>
                This feature requires {TIER_NAMES[requiredTier]} subscription or higher.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Link to={createPageUrl('PricingPlans')}>
                <Button className="w-full">View Plans & Upgrade</Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return <>{children}</>;
}
