// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, MapPin, Heart, TrendingUp, Trophy } from 'lucide-react';

const CITIES = ['New York', 'Toronto', 'Houston', 'Atlanta', 'Chicago', 'Vancouver', 'Montreal', 'Miami', 'Los Angeles', 'Dallas', 'Washington DC', 'Calgary', 'Ottawa', 'Philadelphia', 'San Francisco', 'Boston'];
const NAMES_M = ['Kwame', 'Chidi', 'Amari', 'Kofi', 'Jabari', 'Tendai', 'Emeka', 'Sekou'];
const NAMES_F = ['Amina', 'Zuri', 'Nia', 'Aisha', 'Fatou', 'Adama', 'Nala', 'Sade'];

function randomItem(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomNum(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getTemplates(userCity?: string) {
  const city = userCity || randomItem(CITIES);
  return [
    () => ({ icon: Heart, text: `${randomItem(NAMES_M)} just matched with ${randomItem(NAMES_F)}`, color: 'text-pink-500' }),
    () => ({ icon: Users, text: `Someone just joined from ${randomItem(CITIES)}`, color: 'text-primary' }),
    () => ({ icon: Zap, text: `${randomNum(3, 12)} people online near you`, color: 'text-amber-500' }),
    () => ({ icon: MapPin, text: `New match happening in ${randomItem(CITIES)} right now`, color: 'text-emerald-500' }),
    () => ({ icon: TrendingUp, text: `People in ${city} got ${randomNum(8, 25)} matches today`, color: 'text-primary' }),
    () => ({ icon: Trophy, text: `${randomItem(NAMES_M)} got ${randomNum(2, 5)} matches this hour`, color: 'text-amber-500' }),
    () => ({ icon: Zap, text: `Users who complete profiles get 5x more matches`, color: 'text-emerald-500' }),
    () => ({ icon: Heart, text: `${randomNum(15, 40)} people are swiping in ${city} now`, color: 'text-pink-500' }),
  ];
}

export default function LiveActivityFeed({ className = '', userProfile }: { className?: string; userProfile?: any }) {
  const userCity = userProfile?.current_city;
  const templates = getTemplates(userCity);
  const [activity, setActivity] = useState(() => templates[0]());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        const t = getTemplates(userCity);
        setActivity(t[Math.floor(Math.random() * t.length)]());
        setVisible(true);
      }, 500);
    }, 6000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [userCity]);

  const Icon = activity.icon;

  return (
    <div className={`mb-3 ${className}`}>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={activity.text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
          >
            <div className="relative">
              <Icon size={14} className={activity.color} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">{activity.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
