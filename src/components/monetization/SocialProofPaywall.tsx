// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Heart } from 'lucide-react';

export default function SocialProofPaywall({ className = "" }) {
  const [currentProof, setCurrentProof] = useState(0);
  const [upgradeCount, setUpgradeCount] = useState(47);

  const socialProofs = [
    { name: 'Sarah', area: 'your area', action: 'just matched after upgrading', icon: Heart },
    { name: 'Michael', area: 'nearby', action: 'upgraded to Elite', icon: TrendingUp },
    { name: 'Amara', area: 'your city', action: 'found their match today', icon: Heart },
    { name: 'David', area: 'close by', action: 'got 5 new likes after upgrading', icon: Users },
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
        <span><span className="font-bold text-primary">{upgradeCount}</span> people upgraded today</span>
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
        🔥 Limited time: 3-day free trial ending soon
      </motion.p>
    </div>
  );
}
