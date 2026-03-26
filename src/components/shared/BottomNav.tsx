// @ts-nocheck
import { Heart, Compass, CalendarDays, UserRound, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Compass, label: 'Discover', path: '/home' },
  { icon: Heart, label: 'Matches', path: '/matches' },
  { icon: Users, label: 'Community', path: '/communities' },
  { icon: CalendarDays, label: 'Events', path: '/events' },
  { icon: UserRound, label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
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
              </div>
              <span className={cn(
                "text-[10px] transition-all duration-200",
                isActive ? "font-semibold" : "font-medium"
              )}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
