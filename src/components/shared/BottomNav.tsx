import { Heart, Sparkles, CalendarDays, UserRoundPen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { type: 'discover' as const, label: 'Discover', path: '/home' },
  { type: 'icon' as const, icon: Sparkles, label: 'Stories', path: '/stories' },
  { type: 'icon' as const, icon: Heart, label: 'Matches', path: '/matches' },
  { type: 'icon' as const, icon: CalendarDays, label: 'Events', path: '/events' },
  { type: 'icon' as const, icon: UserRoundPen, label: 'Edit', path: '/editprofile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ label, path, ...item }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full touch-manipulation transition-colors",
                "active:scale-95 active:text-primary",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {item.type === 'discover' ? (
                <div className={cn(
                  "rounded-full w-[24px] h-[24px] border-2 transition-colors",
                  isActive ? "border-primary" : "border-muted-foreground"
                )} />
              ) : (
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
