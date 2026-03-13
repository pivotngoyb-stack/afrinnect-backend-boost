import { Home, Heart, MessageCircle, Compass, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Compass, label: 'Discover', path: '/events' },
  { icon: Heart, label: 'Matches', path: '/matches' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-manipulation transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
