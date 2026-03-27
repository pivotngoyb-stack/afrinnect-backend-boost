// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, MapPin, Heart, TrendingUp, Trophy } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

const CITIES = ['New York', 'Toronto', 'Houston', 'Atlanta', 'Chicago', 'Vancouver', 'Montreal', 'Miami', 'Los Angeles', 'Dallas', 'Washington DC', 'Calgary', 'Ottawa', 'Philadelphia', 'San Francisco', 'Boston'];
const NAMES_M = ['Kwame', 'Chidi', 'Amari', 'Kofi', 'Jabari', 'Tendai', 'Emeka', 'Sekou'];
const NAMES_F = ['Amina', 'Zuri', 'Nia', 'Aisha', 'Fatou', 'Adama', 'Nala', 'Sade'];

function randomItem(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomNum(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getTemplates(t: (key: string) => string, userCity?: string) {
  const city = userCity || randomItem(CITIES);
  return [
    () => ({ icon: Heart, text: t('engagement.liveActivity.matched').replace('{name1}', randomItem(NAMES_M)).replace('{name2}', randomItem(NAMES_F)), color: 'text-pink-500' }),
    () => ({ icon: Users, text: t('engagement.liveActivity.joined').replace('{city}', randomItem(CITIES)), color: 'text-primary' }),
    () => ({ icon: Zap, text: t('engagement.liveActivity.online').replace('{count}', String(randomNum(3, 12))), color: 'text-amber-500' }),
    () => ({ icon: MapPin, text: t('engagement.liveActivity.newMatch').replace('{city}', randomItem(CITIES)), color: 'text-emerald-500' }),
    () => ({ icon: TrendingUp, text: t('engagement.liveActivity.matchesToday').replace('{city}', city).replace('{count}', String(randomNum(8, 25))), color: 'text-primary' }),
    () => ({ icon: Trophy, text: t('engagement.liveActivity.matchesHour').replace('{name}', randomItem(NAMES_M)).replace('{count}', String(randomNum(2, 5))), color: 'text-amber-500' }),
    () => ({ icon: Zap, text: t('engagement.liveActivity.completeTip'), color: 'text-emerald-500' }),
    () => ({ icon: Heart, text: t('engagement.liveActivity.swiping').replace('{count}', String(randomNum(15, 40))).replace('{city}', city), color: 'text-pink-500' }),
  ];
}

export default function LiveActivityFeed({ className = '', userProfile }: { className?: string; userProfile?: any }) {
  const { t } = useLanguage();
  const userCity = userProfile?.current_city;
  const templates = getTemplates(t, userCity);
  const [activity, setActivity] = useState(() => templates[0]());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        const tpls = getTemplates(t, userCity);
        setActivity(tpls[Math.floor(Math.random() * tpls.length)]());
        setVisible(true);
      }, 500);
    }, 6000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [userCity, t]);

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
