import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Trophy, Check, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const REWARD_LADDER = [
  { day: 1, title: 'Welcome Boost', description: '+5 Free Likes', emoji: '🎉', type: 'likes', value: 5 },
  { day: 2, title: 'Visibility Boost', description: '+10% More Visibility', emoji: '👀', type: 'visibility', value: 10 },
  { day: 3, title: 'Free Boost', description: '1 Profile Boost', emoji: '🚀', type: 'boost', value: 1 },
  { day: 4, title: 'Super Likes', description: '+5 Super Like Chances', emoji: '⭐', type: 'super_like', value: 5 },
  { day: 5, title: 'Profile Highlight', description: 'Highlighted for 24h', emoji: '✨', type: 'highlight', value: 1 },
  { day: 6, title: 'Priority Discovery', description: 'Appear First in Feeds', emoji: '🔥', type: 'priority', value: 1 },
  { day: 7, title: 'Streak Champion', description: '1 Super Like + Streak Badge', emoji: '🏆', type: 'streak_badge', value: 1 },
];

export default function RetentionRewards({ userProfile }) {
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    const streak = Math.max(userProfile.login_streak || 0, 1);
    const lastClaim = localStorage.getItem('last_reward_claim');
    const today = new Date().toISOString().split('T')[0];
    if (lastClaim === today) return;

    const dayIndex = ((streak - 1) % 7);
    const reward = REWARD_LADDER[dayIndex];
    if (reward) {
      setCurrentReward({ ...reward, streak });
      setTimeout(() => setShowReward(true), 2000);
    }
  }, [userProfile]);

  const claimReward = () => {
    localStorage.setItem('last_reward_claim', new Date().toISOString().split('T')[0]);
    setClaimed(true);
    setTimeout(() => setShowReward(false), 2500);
  };

  if (!showReward || !currentReward) return null;

  const streakDay = ((currentReward.streak - 1) % 7) + 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 30 }}
          className="bg-background rounded-3xl p-6 max-w-sm w-full text-center relative shadow-2xl"
        >
          {!claimed && (
            <button onClick={() => setShowReward(false)} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition">
              <X size={18} />
            </button>
          )}

          {/* Streak Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {REWARD_LADDER.map((r, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i < streakDay
                    ? 'bg-primary text-primary-foreground border-primary'
                    : i === streakDay - 1
                    ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30 ring-offset-2'
                    : 'bg-muted text-muted-foreground border-muted'
                }`}>
                  {i < streakDay - 1 ? <Check size={14} /> : r.emoji}
                </div>
                {i < 6 && <div className={`w-4 h-0.5 mt-1 ${i < streakDay - 1 ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Flame size={20} className="text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">Day {streakDay} Streak</span>
          </div>

          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
            {claimed ? <Trophy size={40} className="text-primary-foreground" /> : <span className="text-4xl">{currentReward.emoji}</span>}
          </div>

          <h2 className="text-2xl font-bold mb-1">{currentReward.title}</h2>
          <p className="text-lg text-muted-foreground mb-5">{currentReward.description}</p>

          {!claimed ? (
            <Button onClick={claimReward} className="w-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground py-5 text-base rounded-full shadow-lg">
              <Gift size={18} className="mr-2" />
              Claim Day {streakDay} Reward
            </Button>
          ) : (
            <div className="space-y-2">
              <Badge className="bg-green-600 text-sm px-5 py-1.5">✓ Claimed!</Badge>
              <p className="text-sm text-muted-foreground">Come back tomorrow for Day {streakDay < 7 ? streakDay + 1 : 1}!</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
