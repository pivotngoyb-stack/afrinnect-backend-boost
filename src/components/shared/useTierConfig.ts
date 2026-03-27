// @ts-nocheck

const DEFAULT_TIERS: Record<string, any> = {
  free: {
    tier_id: 'free',
    display_name: 'Free',
    limits: { daily_likes: 10, daily_messages: 50, daily_rewinds: 0, daily_super_likes: 1, monthly_boosts: 0 },
    features: []
  },
  premium: {
    tier_id: 'premium',
    display_name: 'Premium',
    limits: { daily_likes: 50, daily_messages: 100, daily_rewinds: 5, daily_super_likes: 5, monthly_boosts: 1 },
    features: [
      { key: 'see_who_liked', enabled: true },
      { key: 'advanced_filters', enabled: true },
      { key: 'read_receipts', enabled: true }
    ]
  },
  elite: {
    tier_id: 'elite',
    display_name: 'Elite',
    limits: { daily_likes: -1, daily_messages: -1, daily_rewinds: -1, daily_super_likes: -1, monthly_boosts: -1 },
    features: [
      { key: 'see_who_liked', enabled: true },
      { key: 'advanced_filters', enabled: true },
      { key: 'read_receipts', enabled: true },
      { key: 'virtual_gifts', enabled: true },
      { key: 'priority_ranking', enabled: true },
      { key: 'incognito_mode', enabled: true },
      { key: 'verified_badge', enabled: true }
    ]
  },
  vip: {
    tier_id: 'vip',
    display_name: 'VIP',
    limits: { daily_likes: -1, daily_messages: -1, daily_rewinds: -1, daily_super_likes: -1, monthly_boosts: -1 },
    features: [
      { key: 'see_who_liked', enabled: true },
      { key: 'advanced_filters', enabled: true },
      { key: 'read_receipts', enabled: true },
      { key: 'virtual_gifts', enabled: true },
      { key: 'priority_ranking', enabled: true },
      { key: 'incognito_mode', enabled: true },
      { key: 'verified_badge', enabled: true },
      { key: 'featured_profile', enabled: true },
      { key: 'profile_insights', enabled: true },
      { key: 'concierge_support', enabled: true },
      { key: 'virtual_speed_dating', enabled: true }
    ]
  }
};

export function getTierLimit(tiers: any, tierId: string, limitType: string) {
  const tier = tiers?.[tierId] || DEFAULT_TIERS[tierId] || DEFAULT_TIERS.free;
  return tier?.limits?.[limitType] ?? 0;
}

export function isUnlimited(limit: number) {
  return limit === -1;
}

export function hasFeatureAccess(tiers: any, tierId: string, featureKey: string) {
  const tier = tiers?.[tierId] || DEFAULT_TIERS[tierId] || DEFAULT_TIERS.free;
  const feature = tier?.features?.find((f: any) => f.key === featureKey);
  return feature?.enabled ?? false;
}

export function formatLimitDisplay(limit: number, suffix = '/day') {
  if (limit === -1) return 'Unlimited';
  if (limit === 0) return '-';
  return `${limit}${suffix}`;
}

export { DEFAULT_TIERS };

export function invalidateTierCache() {
  // No-op stub — tier cache invalidation placeholder
}

export function useTierConfig() {
  return DEFAULT_TIERS;
}
