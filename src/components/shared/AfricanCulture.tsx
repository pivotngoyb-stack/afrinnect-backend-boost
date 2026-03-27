// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AFRICAN_PROVERBS = [
  { text: "If you want to go fast, go alone. If you want to go far, go together.", origin: "African Proverb" },
  { text: "A single bracelet does not jingle.", origin: "Congolese Proverb" },
  { text: "The heart that loves is always young.", origin: "Greek-African Proverb" },
  { text: "Love is like a baby: it needs to be treated tenderly.", origin: "Congolese Proverb" },
  { text: "Where there is love, there is no darkness.", origin: "Burundian Proverb" },
  { text: "The sun does not forget a village just because it is small.", origin: "African Proverb" },
  { text: "However long the night, the dawn will break.", origin: "African Proverb" },
  { text: "Ubuntu: I am because we are.", origin: "Zulu Philosophy" },
  { text: "A tree is known by its fruit.", origin: "Zulu Proverb" },
  { text: "Two people can defeat a bear.", origin: "Ethiopian Proverb" },
];

const GREETINGS = [
  { greeting: "Jambo", language: "Swahili", meaning: "Hello" },
  { greeting: "Sanibonani", language: "Zulu", meaning: "Greetings" },
  { greeting: "Akwaaba", language: "Akan", meaning: "Welcome" },
  { greeting: "Merhaba", language: "Amharic", meaning: "Hello" },
  { greeting: "Ẹ kú àárọ̀", language: "Yoruba", meaning: "Good morning" },
  { greeting: "Habari", language: "Swahili", meaning: "How are you" },
];

/**
 * African proverb loading screen — replaces generic spinners
 */
export function AfricanProverbLoader({ className = "" }: { className?: string }) {
  const [proverb] = useState(() => AFRICAN_PROVERBS[Math.floor(Math.random() * AFRICAN_PROVERBS.length)]);

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="w-12 h-12 mb-6"
      >
        <svg viewBox="0 0 48 48" className="text-primary w-full h-full">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 86" strokeLinecap="round" />
          {/* Adinkra center dot */}
          <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.3" />
        </svg>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-foreground/80 text-center italic max-w-xs leading-relaxed"
      >
        "{proverb.text}"
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-muted-foreground mt-2"
      >
        — {proverb.origin}
      </motion.p>
    </div>
  );
}

/**
 * Cultural greeting banner for home page
 */
export function CulturalGreeting({ userName, className = "" }: { userName?: string; className?: string }) {
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    const greetingPool = GREETINGS;
    return greetingPool[Math.floor(Math.random() * greetingPool.length)];
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <span className="text-lg font-bold text-foreground">{greeting.greeting}</span>
      {userName && <span className="text-lg text-foreground">{userName}!</span>}
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {greeting.meaning} • {greeting.language}
      </span>
    </motion.div>
  );
}

/**
 * Get a random African proverb
 */
export function getRandomProverb() {
  return AFRICAN_PROVERBS[Math.floor(Math.random() * AFRICAN_PROVERBS.length)];
}

export { AFRICAN_PROVERBS, GREETINGS };
