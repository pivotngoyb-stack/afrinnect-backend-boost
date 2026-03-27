// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Heart } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function SocialProofPaywall({ className = "" }) {
  const { t } = useLanguage();
  const [currentProof, setCurrentProof] = useState(0);
  const [upgradeCount, setUpgradeCount] = useState(47);

  const socialProofs = [
    { name: 'Sarah', area: 'your area', action: t('monetization.socialProof.justMatched'), icon: Heart },
    { name: 'Michael', area: 'nearby', action: t('monetization.socialProof.upgradedElite'), icon: TrendingUp },
    { name: 'Amara', area: 'your city', action: t('monetization.socialProof.foundMatch'), icon: Heart },
    { name: 'David', area: 'close by', action: t('monetization.socialProof.gotLikes'), icon: Users },
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentProof((prev) => (prev + 1) % socialProofs.length), 4000);
    const countInterval = setInterval(() => setUpgradeCount(prev => prev + Math.floor(Math.random() * 2)), 30000);
    return () => { clearInterval(interval); clearInterval(countInterval); };
  }, []);

  const proof = socialProofs[currentProof];
  const ProofIcon = proof.icon;

  return (
    <div className={`space-y-3 ${className}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2 h-2 bg-green-500 rounded-full" />
        <span>{t('monetization.socialProof.upgradedToday').replace('{count}', String(upgradeCount))}</span>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={currentProof} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary/10 to-pink-500/10 rounded-lg px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
            <ProofIcon size={14} className="text-primary-foreground" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-foreground">{proof.name}</span>
            <span className="text-muted-foreground"> from </span>
            <span className="text-primary">{proof.area}</span>
            <span className="text-muted-foreground"> {proof.action}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.p animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 2 }} className="text-center text-xs text-amber-600 font-medium">
        {t('monetization.socialProof.limitedTime')}
      </motion.p>
    </div>
  );
}
