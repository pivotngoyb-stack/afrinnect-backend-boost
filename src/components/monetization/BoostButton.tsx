// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crown, Users, Loader2, X, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface BoostButtonProps {
  userProfile: any;
  onBoostActivated?: () => void;
  onBoostSuccess?: () => void;
  variant?: 'full' | 'compact';
}

const TIER_LABELS: Record<string, string> = {
  free: '0 boosts/month',
  premium: '1 boost/month (30 min)',
  elite: '5 boosts/month (60 min)',
  vip: 'Unlimited boosts (120 min)',
};

export default function BoostButton({ userProfile, onBoostActivated, onBoostSuccess, variant = 'full' }: BoostButtonProps) {
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [error, setError] = useState('');

  const tier = userProfile?.subscription_tier || 'free';

  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.profile_boost_active && userProfile.boost_expires_at) {
      const expiresAt = new Date(userProfile.boost_expires_at).getTime();
      if (expiresAt > Date.now()) {
        setIsBoostActive(true);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (!isBoostActive || !userProfile?.boost_expires_at) return;
    const update = () => {
      const diff = new Date(userProfile.boost_expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setIsBoostActive(false);
        setBoostTimeLeft('');
        return false;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setBoostTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
      return true;
    };
    if (!update()) return;
    const interval = setInterval(() => { if (!update()) clearInterval(interval); }, 30000);
    return () => clearInterval(interval);
  }, [isBoostActive, userProfile]);

  const handleBoost = async () => {
    setIsBoosting(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('boost-profile');

      // On success (2xx), data contains the response body
      if (data?.success) {
        toast({ title: '🚀 Profile Boosted!', description: `Your profile will be shown to more people for ${data.duration_minutes} minutes.` });
        setIsBoostActive(true);
        setShowModal(false);
        onBoostActivated?.();
        onBoostSuccess?.();
        return;
      }

      // On non-2xx, fnError is a FunctionsHttpError — parse the JSON body from it
      let errorBody: any = data || {};
      if (fnError && typeof fnError === 'object' && 'context' in fnError) {
        try {
          const ctx = (fnError as any).context;
          if (ctx?.json) {
            errorBody = await ctx.json();
          } else if (ctx?.text) {
            const text = await ctx.text();
            try { errorBody = JSON.parse(text); } catch { errorBody = { error: text }; }
          }
        } catch {
          // fallback
        }
      }

      if (errorBody.upgrade_required) {
        setError('Boosts are available on Premium and above. Upgrade your plan!');
      } else if (errorBody.limit_reached) {
        setError(errorBody.error || 'Monthly boost limit reached.');
      } else if (errorBody.verification_required) {
        setError('Complete photo or ID verification to unlock boosts.');
      } else if (errorBody.already_active) {
        setError('You already have an active boost.');
      } else if (errorBody.error) {
        setError(errorBody.error);
      } else if (fnError) {
        setError(fnError.message || 'Failed to activate boost. Please try again.');
      } else {
        setError('Something went wrong.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsBoosting(false);
    }
  };

  const compactButton = (
    <Button
      onClick={() => setShowModal(true)}
      variant={isBoostActive ? "outline" : "default"}
      className={isBoostActive ? "border-primary text-primary" : ""}
      size="lg"
    >
      <Zap size={20} className={isBoostActive ? "fill-primary" : "fill-primary-foreground"} />
      <span className="ml-2">
        {isBoostActive ? `Boosted (${boostTimeLeft})` : 'Boost Profile'}
      </span>
    </Button>
  );

  const fullButton = (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        {isBoostActive ? (
          <motion.div
            animate={{ boxShadow: ['0 0 20px hsl(var(--primary) / 0.4)', '0 0 40px hsl(var(--primary) / 0.6)', '0 0 20px hsl(var(--primary) / 0.4)'] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-gradient-to-r from-primary to-accent rounded-2xl p-4 text-primary-foreground"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Zap size={24} className="text-yellow-300" />
                </motion.div>
                <span className="font-bold text-lg">BOOST ACTIVE!</span>
              </div>
              <Badge className="bg-background/20 text-primary-foreground border-0">{boostTimeLeft} left</Badge>
            </div>
            <div className="flex items-center gap-2 bg-background/10 rounded-lg px-3 py-2">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-green-400 rounded-full" />
              <Users size={16} />
              <span className="text-sm font-medium">Your profile is getting extra visibility</span>
            </div>
          </motion.div>
        ) : (
          <Button
            onClick={() => setShowModal(true)}
            className="w-full h-14 bg-gradient-to-r from-primary via-accent to-primary hover:opacity-90 text-primary-foreground font-bold text-lg shadow-lg"
          >
            <Zap size={22} className="mr-2" />
            Boost Your Profile
            <Badge className="ml-2 bg-background/20 border-0 text-primary-foreground">10x visibility</Badge>
          </Button>
        )}
      </motion.div>

      {/* Unified Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>

              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap size={28} className="text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Boost Your Profile</h3>
                <p className="text-sm text-muted-foreground mt-1">Get up to 10x more views</p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {isBoostActive && (
                <Alert className="mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <AlertDescription>Boost active — {boostTimeLeft} remaining</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 mb-4">
                {['Appear first in discovery', 'Up to 10x more profile views', 'Prioritized in your area'].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                    <span className="text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>

              <div className="bg-muted rounded-lg p-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Your Plan:</strong> <Badge variant="secondary">{tier.toUpperCase()}</Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{TIER_LABELS[tier] || TIER_LABELS.free}</p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleBoost}
                  disabled={isBoosting || isBoostActive}
                  className="w-full h-11"
                >
                  {isBoosting ? (
                    <><Loader2 size={18} className="mr-2 animate-spin" /> Boosting...</>
                  ) : isBoostActive ? (
                    'Already Boosted'
                  ) : (
                    <><Zap size={18} className="mr-2" /> Boost Now</>
                  )}
                </Button>

                {tier === 'free' && (
                  <Link to="/pricing">
                    <Button variant="outline" className="w-full h-11">
                      <Crown size={18} className="mr-2 text-amber-500" />
                      Upgrade for Boosts
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
