import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RetentionRewards({ userProfile }) {
  const [reward, setReward] = useState(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    const streak = userProfile.login_streak || 0;
    const lastRewardClaim = localStorage.getItem('last_reward_claim');
    const today = new Date().toISOString().split('T')[0];
    if (lastRewardClaim === today) return;

    if (streak === 7) {
      setReward({ title: '7-Day Streak! 🔥', description: '1 Free Super Like', type: 'super_like', value: 1 });
    } else if (streak === 30) {
      setReward({ title: '30-Day Streak! 🎉', description: '3 Free Profile Boosts', type: 'boost', value: 3 });
    } else if (streak % 100 === 0 && streak > 0) {
      setReward({ title: `${streak}-Day Streak! 🏆`, description: '1 Month Premium Free!', type: 'premium', value: 30 });
    }
  }, [userProfile]);

  const claimReward = async () => {
    if (!reward) return;
    try {
      if (reward.type === 'super_like' || reward.type === 'boost') {
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_profile_id', userProfile.id)
          .eq('status', 'active')
          .limit(1);

        if (subs?.length) {
          const update = reward.type === 'super_like'
            ? { super_likes_remaining: (subs[0].super_likes_remaining || 0) + reward.value }
            : { boosts_remaining: (subs[0].boosts_remaining || 0) + reward.value };
          await supabase.from('subscriptions').update(update).eq('id', subs[0].id);
        }
      } else if (reward.type === 'premium') {
        await supabase.from('user_profiles').update({
          subscription_tier: 'premium',
          is_premium: true,
          premium_until: new Date(Date.now() + reward.value * 24 * 60 * 60 * 1000).toISOString()
        }).eq('id', userProfile.id);
      }

      localStorage.setItem('last_reward_claim', new Date().toISOString().split('T')[0]);
      setClaimed(true);
      setTimeout(() => setReward(null), 3000);
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  if (!reward) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          className="bg-background rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl"
        >
          {!claimed && (
            <button onClick={() => setReward(null)} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition">
              <X size={20} />
            </button>
          )}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            {claimed ? <Trophy size={48} className="text-primary-foreground" /> : <Gift size={48} className="text-primary-foreground" />}
          </div>
          <h2 className="text-3xl font-bold mb-2">{reward.title}</h2>
          <p className="text-xl text-muted-foreground mb-6">{reward.description}</p>
          {!claimed ? (
            <>
              <Badge className="bg-primary text-lg px-6 py-2 mb-6">Streak Reward</Badge>
              <Button onClick={claimReward} className="w-full bg-gradient-to-r from-primary to-amber-600 text-primary-foreground py-6 text-lg rounded-full shadow-lg">
                Claim Reward
              </Button>
            </>
          ) : (
            <div>
              <Badge className="bg-green-600 text-lg px-6 py-2">✓ Claimed!</Badge>
              <p className="text-sm text-muted-foreground mt-4">Keep your streak going!</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
