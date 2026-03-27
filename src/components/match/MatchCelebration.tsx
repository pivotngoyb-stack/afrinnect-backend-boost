import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import AfricanPattern from '@/components/shared/AfricanPattern';

const MATCH_PHRASES = [
  "It's a Match! 💕",
  "Ubuntu! You've Connected! 💕",
  "Your Hearts Align! 💕",
  "A Beautiful Connection! 💕",
];

export default function MatchCelebration({ matchedProfile, onClose }) {
  useEffect(() => {
    if (matchedProfile) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;

      // African-inspired confetti colors: gold, terracotta, deep purple, green
      const colors = ['#D4A017', '#C75B39', '#6B2FA0', '#2D8B46', '#E8C547', '#ec4899'];

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) { clearInterval(interval); return; }

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });
      }, 30);

      return () => clearInterval(interval);
    }
  }, [matchedProfile]);

  if (!matchedProfile) return null;

  const phrase = MATCH_PHRASES[Math.floor(Math.random() * MATCH_PHRASES.length)];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="gradient-hero rounded-3xl p-8 max-w-md mx-4 text-center relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* African pattern overlay */}
          <AfricanPattern variant="adinkra" opacity={0.08} className="text-white" />

          {/* Kente-inspired border accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[hsl(var(--brand-gold))] via-[hsl(var(--brand-coral))] to-[hsl(var(--brand-gold))]" />
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[hsl(var(--brand-gold))] via-[hsl(var(--brand-coral))] to-[hsl(var(--brand-gold))]" />

          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-card/10 rounded-full blur-3xl"
          />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Heart size={64} className="mx-auto text-white mb-4 fill-white" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            {phrase}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-lg mb-6"
          >
            You and {matchedProfile.display_name} liked each other!
          </motion.p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="flex justify-center gap-4 mb-6"
          >
            <div className="relative">
              <img
                src={matchedProfile.primary_photo || matchedProfile.photos?.[0]}
                alt={matchedProfile.display_name}
                className="w-24 h-24 rounded-full border-4 border-[hsl(var(--brand-gold))] object-cover"
              />
              {/* Gold ring animation */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full border-2 border-[hsl(var(--brand-gold))]"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-2 text-white/80 text-sm"
          >
            <Sparkles size={16} />
            <span>Redirecting to your matches...</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
