import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Crown, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ExitIntentOfferProps {
  userProfileId?: string;
  onDismiss?: () => void;
}

export default function ExitIntentOffer({ userProfileId, onDismiss }: ExitIntentOfferProps) {
  const [promo, setPromo] = useState<{ code: string; discount_percent: number; valid_until: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!userProfileId) return;

    // Only show once per session
    const shown = sessionStorage.getItem('exit_intent_shown');
    if (shown) return;

    const fetchPromo = async () => {
      // Check if user already has active subscription
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_profile_id', userProfileId)
        .eq('status', 'active')
        .limit(1);

      if (subs && subs.length > 0) return; // Already subscribed

      // Check if there's an active promo code they haven't redeemed
      const now = new Date().toISOString();
      const { data: promos } = await supabase
        .from('promo_codes')
        .select('id, code, discount_percent, valid_until, max_redemptions, current_redemptions')
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_until', now)
        .order('discount_percent', { ascending: false })
        .limit(5);

      if (!promos || promos.length === 0) return;

      // Filter out fully redeemed codes
      const available = promos.find(p => 
        p.max_redemptions === null || p.current_redemptions < p.max_redemptions
      );
      if (!available) return;

      // Check if user already redeemed this code
      const { data: redemptions } = await supabase
        .from('promo_code_redemptions')
        .select('id')
        .eq('promo_code_id', available.id)
        .eq('user_profile_id', userProfileId)
        .limit(1);

      if (redemptions && redemptions.length > 0) return;

      setPromo({
        code: available.code,
        discount_percent: available.discount_percent,
        valid_until: available.valid_until,
      });
    };

    fetchPromo();
  }, [userProfileId]);

  // Detect exit intent (mouse leaving viewport on desktop)
  useEffect(() => {
    if (!promo || dismissed) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !visible) {
        setVisible(true);
        sessionStorage.setItem('exit_intent_shown', 'true');
      }
    };

    // On mobile, show after 30s on pricing page instead
    const mobileTimer = setTimeout(() => {
      if (!visible && window.innerWidth < 768) {
        setVisible(true);
        sessionStorage.setItem('exit_intent_shown', 'true');
      }
    }, 30000);

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(mobileTimer);
    };
  }, [promo, visible, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    onDismiss?.();
  };

  if (!promo) return null;

  const validDate = new Date(promo.valid_until);
  const daysLeft = Math.max(0, Math.ceil((validDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-background rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl border"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 hover:bg-muted rounded-full transition"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Gift size={28} className="text-primary-foreground" />
            </div>

            <h2 className="text-xl font-bold mb-1">Wait! Special offer for you</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Use code <span className="font-mono font-bold text-primary">{promo.code}</span> for{' '}
              <strong>{promo.discount_percent}% off</strong> your first month
            </p>

            <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground">
              <Tag size={12} />
              <span>
                {daysLeft > 0 ? `Valid for ${daysLeft} more day${daysLeft > 1 ? 's' : ''}` : 'Expires today'}
              </span>
            </div>

            <Link to={createPageUrl('PricingPlans')}>
              <Button className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 py-5 text-base rounded-full">
                <Crown size={18} className="mr-2" />
                Claim {promo.discount_percent}% Off
              </Button>
            </Link>

            <button
              onClick={handleDismiss}
              className="mt-3 text-sm text-muted-foreground hover:text-foreground transition"
            >
              No thanks, I'll pay full price
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
