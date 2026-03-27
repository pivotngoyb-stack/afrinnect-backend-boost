import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, MapPin, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from '@/components/shared/Logo';
import FilterDrawer from '@/components/discovery/FilterDrawer';
import LikesCounter from '@/components/monetization/LikesCounter';

import NotificationBell from '@/components/shared/NotificationBell';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';
import ActivityDrawer from '@/components/home/ActivityDrawer';
import BoostButton from '@/components/monetization/BoostButton';

interface HomeHeaderProps {
  discoveryMode: string;
  setDiscoveryMode: (mode: string) => void;
  viewMode?: string;
  setViewMode?: (mode: string) => void;
  filters: any;
  setFilters: (f: any) => void;
  myProfile: any;
  isAdmin: boolean;
  activityCounts: { likes: number; views: number } | undefined;
  onBoostActivated?: () => void;
}

export default function HomeHeader({
  discoveryMode, setDiscoveryMode,
  filters, setFilters,
  myProfile, isAdmin, activityCounts, onBoostActivated,
}: HomeHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="flex-shrink-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <Logo className="flex-shrink-0" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tabs value={discoveryMode} onValueChange={setDiscoveryMode}>
              <TabsList className="bg-muted h-8">
                <TabsTrigger value="local" className="gap-1 text-xs h-7 px-2">
                  <MapPin size={13} />
                  <span className="hidden sm:inline">{t('home.local')}</span>
                </TabsTrigger>
                <TabsTrigger value="global" className="gap-1 text-xs h-7 px-2">
                  <Globe size={13} />
                  <span className="hidden sm:inline">{t('home.global')}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <FilterDrawer
              filters={filters}
              onFiltersChange={setFilters}
              isPremium={myProfile?.is_premium}
              userTier={myProfile?.subscription_tier || 'free'}
            />

            <LikesCounter userProfile={myProfile} />

            <NotificationBell />
            <ActivityDrawer userProfile={myProfile} />
            <BoostButton userProfile={myProfile} onBoostActivated={onBoostActivated} compact />

            {isAdmin && (
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 flex-shrink-0" title="Admin Dashboard">
                  <Crown size={20} />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
