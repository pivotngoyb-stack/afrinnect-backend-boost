// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, MapPin, Heart } from 'lucide-react';

const CITIES = ['Nairobi', 'Lagos', 'Accra', 'Johannesburg', 'Addis Ababa', 'Dar es Salaam', 'Kampala', 'Kigali', 'Dakar', 'Abidjan', 'New York', 'London', 'Toronto', 'Paris', 'Houston', 'Atlanta'];
const NAMES_M = ['Kwame', 'Chidi', 'Amari', 'Kofi', 'Jabari', 'Tendai', 'Emeka', 'Sekou'];
const NAMES_F = ['Amina', 'Zuri', 'Nia', 'Aisha', 'Fatou', 'Adama', 'Nala', 'Sade'];

function randomItem(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }

const TEMPLATES = [
  () => ({ icon: Heart, text: `${randomItem(NAMES_M)} just matched with ${randomItem(NAMES_F)}`, color: 'text-pink-500' }),
  () => ({ icon: Users, text: `Someone just joined from ${randomItem(CITIES)}`, color: 'text-primary' }),
  () => ({ icon: Zap, text: `${Math.floor(Math.random() * 8) + 3} people online near you`, color: 'text-amber-500' }),
  () => ({ icon: MapPin, text: `New match happening in ${randomItem(CITIES)} right now`, color: 'text-emerald-500' }),
];

export default function LiveActivityFeed({ className = '' }: { className?: string }) {
  const [activity, setActivity] = useState(() => TEMPLATES[0]());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActivity(TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]());
        setVisible(true);
      }, 500);
    }, 6000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

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
