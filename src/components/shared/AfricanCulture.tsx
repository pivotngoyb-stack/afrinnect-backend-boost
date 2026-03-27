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

// Map countries to their primary greeting
const COUNTRY_GREETINGS: Record<string, { greeting: string; language: string; meaning: string }> = {
  'Nigeria': { greeting: "Bawo ni", language: "Yoruba", meaning: "How are you" },
  'Ghana': { greeting: "Akwaaba", language: "Akan", meaning: "Welcome" },
  'Kenya': { greeting: "Jambo", language: "Swahili", meaning: "Hello" },
  'Tanzania': { greeting: "Habari", language: "Swahili", meaning: "How are you" },
  'Uganda': { greeting: "Oli otya", language: "Luganda", meaning: "How are you" },
  'South Africa': { greeting: "Sawubona", language: "Zulu", meaning: "I see you" },
  'Ethiopia': { greeting: "Selam", language: "Amharic", meaning: "Peace" },
  'Cameroon': { greeting: "Mbolo", language: "Douala", meaning: "Hello" },
  'Senegal': { greeting: "Nanga def", language: "Wolof", meaning: "How are you" },
  'DR Congo': { greeting: "Mbote", language: "Lingala", meaning: "Hello" },
  'Congo': { greeting: "Mbote", language: "Lingala", meaning: "Hello" },
  'Ivory Coast': { greeting: "Aw ni sogoma", language: "Dioula", meaning: "Good morning" },
  'Mali': { greeting: "I ni ce", language: "Bambara", meaning: "Hello" },
  'Somalia': { greeting: "Iska warran", language: "Somali", meaning: "How are you" },
  'Zimbabwe': { greeting: "Mhoro", language: "Shona", meaning: "Hello" },
  'Zambia': { greeting: "Muli bwanji", language: "Chewa", meaning: "How are you" },
  'Rwanda': { greeting: "Muraho", language: "Kinyarwanda", meaning: "Hello" },
  'Mozambique': { greeting: "Olá", language: "Portuguese", meaning: "Hello" },
  'Madagascar': { greeting: "Manao ahoana", language: "Malagasy", meaning: "How are you" },
  'Angola': { greeting: "Olá", language: "Portuguese", meaning: "Hello" },
  'Sudan': { greeting: "Salaam", language: "Arabic", meaning: "Peace" },
  'Egypt': { greeting: "Ahlan", language: "Arabic", meaning: "Welcome" },
  'Morocco': { greeting: "Ahlan", language: "Darija", meaning: "Welcome" },
  'Tunisia': { greeting: "Aslema", language: "Tunisian Arabic", meaning: "Hello" },
  'Algeria': { greeting: "Salam", language: "Algerian Arabic", meaning: "Peace" },
  'Eritrea': { greeting: "Selam", language: "Tigrinya", meaning: "Peace" },
  'Burundi': { greeting: "Amahoro", language: "Kirundi", meaning: "Peace" },
  'Togo': { greeting: "Alafia", language: "Ewe", meaning: "Peace" },
  'Benin': { greeting: "Kú àbọ̀", language: "Fon", meaning: "Welcome" },
  'Sierra Leone': { greeting: "Kushe", language: "Krio", meaning: "Hello" },
  'Liberia': { greeting: "How de body", language: "Liberian English", meaning: "How are you" },
  'Malawi': { greeting: "Moni", language: "Chichewa", meaning: "Hello" },
  'Namibia': { greeting: "Wa lalapo", language: "Oshiwambo", meaning: "Hello" },
  'Botswana': { greeting: "Dumela", language: "Setswana", meaning: "Hello" },
  'Gambia': { greeting: "Nanga def", language: "Wolof", meaning: "How are you" },
  'Guinea': { greeting: "I ni ce", language: "Susu", meaning: "Hello" },
  'Lesotho': { greeting: "Lumela", language: "Sesotho", meaning: "Hello" },
  'Eswatini': { greeting: "Sawubona", language: "Siswati", meaning: "I see you" },
  // Diaspora countries — default to a pan-African greeting
  'United States': { greeting: "Habari", language: "Swahili", meaning: "Hello" },
  'USA': { greeting: "Habari", language: "Swahili", meaning: "Hello" },
  'Canada': { greeting: "Akwaaba", language: "Akan", meaning: "Welcome" },
  'United Kingdom': { greeting: "Jambo", language: "Swahili", meaning: "Hello" },
  'France': { greeting: "Nanga def", language: "Wolof", meaning: "How are you" },
};

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
export function CulturalGreeting({ userName, countryOfOrigin, className = "" }: { userName?: string; countryOfOrigin?: string; className?: string }) {
  const [greeting] = useState(() => {
    // Use heritage country greeting if available, otherwise random
    if (countryOfOrigin && COUNTRY_GREETINGS[countryOfOrigin]) {
      return COUNTRY_GREETINGS[countryOfOrigin];
    }
    return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
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
