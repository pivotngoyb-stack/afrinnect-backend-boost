// @ts-nocheck
import React, { useState } from 'react';
import { updateRecord } from '@/lib/supabase-helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, Eye, Crown, Lock } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function IncognitoModeToggle({ userProfile, onUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const tier = userProfile?.subscription_tier || 'free';
  const canUseIncognito = tier === 'elite' || tier === 'vip';
  const isIncognito = userProfile?.incognito_mode || false;

  const toggleIncognito = async () => {
    if (!canUseIncognito) {
      setShowUpgradeModal(true);
      return;
    }

    setIsUpdating(true);
    try {
      await updateRecord('user_profiles', userProfile.id, {
        incognito_mode: !isIncognito
      });
      onUpdate?.({ ...userProfile, incognito_mode: !isIncognito });
    } catch (e) {
      console.error('Failed to toggle incognito:', e);
    }
    setIsUpdating(false);
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-background rounded-xl border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isIncognito ? 'bg-purple-100' : 'bg-muted'
          }`}>
            {isIncognito ? (
              <EyeOff size={20} className="text-purple-600" />
            ) : (
              <Eye size={20} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Incognito Mode</span>
              {!canUseIncognito && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ELITE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isIncognito ? 'Only people you like can see you' : 'Everyone can see your profile'}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <Switch
            checked={isIncognito}
            onCheckedChange={toggleIncognito}
            disabled={isUpdating || !canUseIncognito}
          />
          {!canUseIncognito && (
            <Lock size={12} className="absolute -top-1 -right-1 text-muted-foreground" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EyeOff size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold">Go Incognito</h3>
                <p className="text-muted-foreground mt-2">Browse profiles without being seen</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-purple-500">✓</span>
                  <span>Your profile is hidden from discovery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-purple-500">✓</span>
                  <span>Only people you like can see you</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-purple-500">✓</span>
                  <span>Browse without leaving a trace</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link to={createPageUrl('PricingPlans')}>
                  <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Crown size={18} className="mr-2" />
                    Unlock with Elite
                  </Button>
                </Link>

                <button 
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}