import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crown, Plus, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getTierLimit, isUnlimited, DEFAULT_TIERS } from '@/components/shared/useTierConfig';

export default function SuperLikeCounter({ userProfile, onBuyMore }) {
  const [superLikesRemaining, setSuperLikesRemaining] = useState(null);
  const [superLikesMax, setSuperLikesMax] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;
    const fetchSuperLikeCounts = async () => {
      try {
        const tier = userProfile.subscription_tier || 'free';
        const dailySuperLikes = getTierLimit(DEFAULT_TIERS, tier, 'daily_super_likes');
        if (isUnlimited(dailySuperLikes)) { setSuperLikesMax(999); setSuperLikesRemaining(999); setIsLoading(false); return; }

        if (tier === 'free') {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data } = await supabase.from('likes').select('id').eq('liker_id', userProfile.id).eq('is_super_like', true).gte('created_at', weekAgo);
          setSuperLikesMax(1);
          setSuperLikesRemaining(Math.max(0, 1 - (data?.length || 0)));
        } else {
          const now = new Date(); now.setHours(0, 0, 0, 0);
          const { data } = await supabase.from('likes').select('id').eq('liker_id', userProfile.id).eq('is_super_like', true).gte('created_at', now.toISOString());
          const limit = dailySuperLikes || 5;
          setSuperLikesMax(limit);
          setSuperLikesRemaining(Math.max(0, limit - (data?.length || 0)));
        }
      } catch (e) { console.error('Failed to fetch super like count:', e); }
      setIsLoading(false);
    };
    fetchSuperLikeCounts();
  }, [userProfile?.id, userProfile?.subscription_tier]);

  const tier = userProfile?.subscription_tier || 'free';
  const isUnlimitedTier = tier === 'elite' || tier === 'vip';

  if (!userProfile?.id) return null;
  if (isLoading) return <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5"><Loader2 size={14} className="animate-spin text-primary" /></div>;
  if (isUnlimitedTier) return <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-purple-500 rounded-full px-3 py-1.5 text-primary-foreground"><Star size={14} className="fill-yellow-300 text-yellow-300" /><span className="text-xs font-bold">∞ Super Likes</span></div>;

  return (
    <>
      <motion.button onClick={() => superLikesRemaining === 0 && setShowBuyModal(true)} whileTap={{ scale: 0.95 }} className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${superLikesRemaining === 0 ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 cursor-pointer' : 'bg-primary/10 text-primary'}`}>
        <Star size={14} className={superLikesRemaining > 0 ? 'fill-primary text-primary' : 'fill-muted-foreground text-muted-foreground'} />
        <span className="text-xs font-bold">{superLikesRemaining}/{superLikesMax} {tier === 'free' ? 'this week' : 'today'}</span>
        {superLikesRemaining === 0 && <Plus size={12} className="text-amber-700" />}
      </motion.button>

      <AnimatePresence>
        {showBuyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowBuyModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"><Star size={32} className="text-yellow-300 fill-yellow-300" /></div>
                <h3 className="text-2xl font-bold text-foreground">Out of Super Likes!</h3>
                <p className="text-muted-foreground mt-2">Stand out to that special someone</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm"><span>⭐</span><span>3x more likely to get matched</span></div>
                <div className="flex items-center gap-3 text-sm"><span>⭐</span><span>They'll know you're really interested</span></div>
                <div className="flex items-center gap-3 text-sm"><span>⭐</span><span>Your profile appears first in their feed</span></div>
              </div>
              <div className="space-y-3">
                <Button className="w-full h-12 bg-gradient-to-r from-primary to-purple-600"><Star size={18} className="mr-2 fill-yellow-300 text-yellow-300" /> Get 3 Super Likes - $4.99</Button>
                <Link to={createPageUrl('PricingPlans')}><Button variant="outline" className="w-full h-12"><Crown size={18} className="mr-2 text-amber-500" />{tier === 'free' ? 'Get 5/day with Premium' : 'Unlimited with Elite'}</Button></Link>
                <button onClick={() => setShowBuyModal(false)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2">Maybe later</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
