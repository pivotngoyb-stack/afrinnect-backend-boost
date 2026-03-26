import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Crown, Lock, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getTierLimit, isUnlimited, DEFAULT_TIERS } from '@/components/shared/useTierConfig';

export default function RewindButton({ userProfile, lastSwipedProfile, onRewind, disabled }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);

  const tier = userProfile?.subscription_tier || 'free';
  const rewindLimit = getTierLimit(DEFAULT_TIERS, tier, 'daily_rewinds');
  const canRewind = rewindLimit > 0 || isUnlimited(rewindLimit);

  const handleClick = async () => {
    if (!canRewind) { setShowUpgradeModal(true); return; }
    if (!lastSwipedProfile) return;
    setIsRewinding(true);
    await onRewind?.();
    setIsRewinding(false);
  };

  return (
    <>
      <motion.div className="relative" whileTap={canRewind ? { scale: 0.95 } : {}}>
        <Button
          onClick={handleClick}
          disabled={disabled || !lastSwipedProfile || isRewinding}
          variant={canRewind ? 'default' : 'outline'}
          className={`relative rounded-full w-12 h-12 ${canRewind ? 'bg-amber-500 hover:bg-amber-600 text-primary-foreground' : 'bg-muted text-muted-foreground border-border'}`}
        >
          {isRewinding ? <Loader2 size={20} className="animate-spin" /> : (
            <>
              <RotateCcw size={20} />
              {!canRewind && <Lock size={10} className="absolute -top-1 -right-1 text-muted-foreground bg-background rounded-full p-0.5" />}
            </>
          )}
        </Button>
        {lastSwipedProfile && canRewind && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background shadow-lg rounded-lg p-1.5 border border-border whitespace-nowrap">
            <div className="flex items-center gap-2">
              <img src={lastSwipedProfile.primary_photo || lastSwipedProfile.photos?.[0]} className="w-8 h-8 rounded-full object-cover" alt="" />
              <div className="text-xs">
                <p className="font-medium text-foreground truncate max-w-[80px]">{lastSwipedProfile.display_name?.split(' ')[0]}</p>
                <p className="text-muted-foreground">Tap to undo</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowUpgradeModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw size={32} className="text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Accidentally Passed?</h3>
                <p className="text-muted-foreground mt-2">Rewind to get them back!</p>
              </div>
              {lastSwipedProfile && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-6">
                  <img src={lastSwipedProfile.primary_photo || lastSwipedProfile.photos?.[0]} className="w-12 h-12 rounded-full object-cover blur-sm" alt="" />
                  <div>
                    <p className="font-medium text-foreground">You just passed {lastSwipedProfile.display_name?.split(' ')[0]}</p>
                    <p className="text-sm text-muted-foreground">Upgrade to undo this action</p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <Link to={createPageUrl('PricingPlans')}>
                  <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                    <Crown size={18} className="mr-2" /> Unlock Rewind with Premium
                  </Button>
                </Link>
                <button onClick={() => setShowUpgradeModal(false)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2">Maybe later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
