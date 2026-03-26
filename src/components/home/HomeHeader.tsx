// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { Grid3X3, Layers, Globe, MapPin, Crown, Heart as HeartIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from '@/components/shared/Logo';
import FilterDrawer from '@/components/discovery/FilterDrawer';
import LikesCounter from '@/components/monetization/LikesCounter';
import SuperLikeCounter from '@/components/monetization/SuperLikeCounter';
import NotificationBell from '@/components/shared/NotificationBell';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface HomeHeaderProps {
  discoveryMode: string;
  setDiscoveryMode: (mode: string) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
  filters: any;
  setFilters: (f: any) => void;
  myProfile: any;
  isAdmin: boolean;
  activityCounts: { likes: number; views: number } | undefined;
}

export default function HomeHeader({
  discoveryMode, setDiscoveryMode,
  viewMode, setViewMode,
  filters, setFilters,
  myProfile, isAdmin, activityCounts,
}: HomeHeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="flex-shrink-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
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

            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="bg-muted h-8">
                <TabsTrigger value="swipe" className="h-7 px-2"><Layers size={16} /></TabsTrigger>
                <TabsTrigger value="grid" className="h-7 px-2"><Grid3X3 size={16} /></TabsTrigger>
              </TabsList>
            </Tabs>

            <FilterDrawer
              filters={filters}
              onFiltersChange={setFilters}
              isPremium={myProfile?.is_premium}
              userTier={myProfile?.subscription_tier || 'free'}
            />

            <LikesCounter userProfile={myProfile} />
            <SuperLikeCounter userProfile={myProfile} />

            <Link to={createPageUrl('WhoLikesYou')}>
              <Button variant="outline" size="icon" className="h-8 w-8 relative border-border">
                <HeartIcon size={16} className="text-destructive" />
                {(activityCounts?.likes > 0 || activityCounts?.views > 0) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
                )}
              </Button>
            </Link>

            <NotificationBell />

            {isAdmin && (
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" title="Admin Dashboard">
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
