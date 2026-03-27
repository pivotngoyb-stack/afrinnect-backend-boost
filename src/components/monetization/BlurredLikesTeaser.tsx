// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Crown, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function BlurredLikesTeaser({ likesCount = 0, className = "" }) {
  const { t } = useLanguage();
  if (likesCount === 0) return null;

  const noun = likesCount === 1 ? t('monetization.blurredLikes.person') : t('monetization.blurredLikes.people');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-purple-200/50 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-pink-500/5 animate-pulse" />
      <div className="relative p-6">
        <div className="flex justify-center -space-x-4 mb-4">
          {[...Array(Math.min(likesCount, 5))].map((_, i) => (
            <motion.div key={i} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: i * 0.1 }} className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 border-3 border-background shadow-lg overflow-hidden">
                <div className="w-full h-full backdrop-blur-xl bg-white/40 flex items-center justify-center">
                  <Heart className="text-pink-500/60" size={20} fill="currentColor" />
                </div>
              </div>
              {i === 0 && (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <Heart className="text-white" size={10} fill="white" />
                </motion.div>
              )}
            </motion.div>
          ))}
          {likesCount > 5 && (
            <div className="w-16 h-16 rounded-full bg-purple-600 border-3 border-background shadow-lg flex items-center justify-center text-white font-bold">
              +{likesCount - 5}
            </div>
          )}
        </div>

        <div className="text-center">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
            <h3 className="text-xl font-bold mb-1">
              {t('monetization.blurredLikes.liked').replace('{count}', String(likesCount)).replace('{noun}', noun)}
            </h3>
          </motion.div>
          <p className="text-muted-foreground text-sm mb-4">{t('monetization.blurredLikes.waiting')}</p>

          <Link to={createPageUrl('PricingPlans')}>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg">
              <Lock size={16} className="mr-2" />
              {t('monetization.blurredLikes.reveal')}
            </Button>
          </Link>
        </div>

        <Sparkles className="absolute top-4 right-4 text-amber-400/50" size={20} />
        <Sparkles className="absolute bottom-4 left-4 text-pink-400/50" size={16} />
      </div>
    </motion.div>
  );
}
