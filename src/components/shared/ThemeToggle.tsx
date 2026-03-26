// @ts-nocheck
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark(!dark)}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={18} className="text-brand-gold" /> : <Moon size={18} />}
    </Button>
  );
}
