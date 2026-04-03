// @ts-nocheck
import React from 'react';
import { Heart, Compass, CalendarDays, UserRound, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { useBottomNavBadges } from '@/hooks/useBottomNavBadges';

export default function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const badges = useBottomNavBadges();

  const navItems = [
    { icon: Compass, label: t('nav.discover'), path: '/home', badge: 0 },
    { icon: Heart, label: t('nav.matches'), path: '/matches', badge: badges.matches },
    { icon: Users, label: t('nav.community'), path: '/communities', badge: badges.communities },
    { icon: CalendarDays, label: t('nav.events'), path: '/events', badge: badges.events },
    { icon: UserRound, label: t('nav.profile'), path: '/profile', badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">

        {navItems.map(({ icon: Icon, label, path, badge }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-manipulation transition-all duration-200",
                "active:scale-90",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative p-1 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 shadow-sm">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200",
                isActive ? "font-semibold" : "font-medium"
              )}>{label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for native iOS home indicator */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
