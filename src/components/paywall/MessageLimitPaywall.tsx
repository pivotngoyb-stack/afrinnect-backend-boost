// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, MessageCircle, Infinity, Heart, TrendingUp, Clock, Sparkles, X, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MessageLimitPaywall({ onClose, matchName }: { onClose: () => void; matchName?: string }) {
  const [upgradeCount, setUpgradeCount] = useState(18);
  const [currentProof, setCurrentProof] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 3, minutes: 45, seconds: 30 });

  const socialProofs = [
    { name: 'Michael', action: 'just messaged their match', time: '1 min ago' },
    { name: 'Aisha', action: 'sent 20 messages today', time: '3 min ago' },
    { name: 'James', action: 'upgraded & got a date!', time: '8 min ago' },
  ];

  useEffect(() => {
    const proofInterval = setInterval(() => {
      setCurrentProof((prev) => (prev + 1) % socialProofs.length);
    }, 3500);
    const countInterval = setInterval(() => {
      setUpgradeCount(prev => prev + Math.floor(Math.random() * 2));
    }, 45000);
    const timerInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => { clearInterval(proofInterval); clearInterval(countInterval); clearInterval(timerInterval); };
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md relative"
      >
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-background rounded-full shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-r from-primary to-pink-500 px-4 py-2 flex items-center justify-center gap-2">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              <Clock size={16} className="text-primary-foreground" />
            </motion.div>
            <span className="text-primary-foreground text-sm font-semibold">
              Flash sale: {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)} left
            </span>
          </div>

          <CardContent className="p-6 text-center">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-xl"
            >
              <MessageCircle size={40} className="text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Don't Leave Them Hanging! 💬
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {matchName ? `${matchName} is waiting for your reply!` : 'Your matches are waiting to hear from you!'}
            </p>

            <div className="bg-muted rounded-xl p-3 mb-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">{matchName || 'Your Match'}</span>
                  <span className="text-xs text-green-500 ml-2">● Online now</span>
                </div>
              </div>
              <div className="bg-primary/10 rounded-lg px-3 py-2 inline-block">
                <p className="text-sm text-foreground">Hey! I saw your profile and...</p>
              </div>
              <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  ●
                </motion.span>
                <span className="text-xs">typing...</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentProof}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-2 mb-4"
              >
                <TrendingUp size={14} className="text-green-500" />
                <span className="text-sm text-foreground">
                  <strong>{socialProofs[currentProof].name}</strong> {socialProofs[currentProof].action}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg p-2">
                <Infinity size={14} className="text-primary" />
                <span className="text-foreground">Unlimited messages</span>
              </div>
              <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg p-2">
                <Send size={14} className="text-pink-600" />
                <span className="text-foreground">Read receipts</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
                <Heart size={14} className="text-blue-600" />
                <span className="text-foreground">Priority inbox</span>
              </div>
              <div className="flex items-center gap-2 bg-accent/10 rounded-lg p-2">
                <Crown size={14} className="text-accent" />
                <span className="text-foreground">VIP badge</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
              <span>
                <strong className="text-primary">{upgradeCount}</strong> upgraded in the last hour
              </span>
            </div>

            <Link to={createPageUrl('PricingPlans')}>
              <Button className="w-full py-6 text-lg shadow-lg mb-3">
                <Sparkles size={20} className="mr-2" />
                Continue Chatting - Upgrade Now
              </Button>
            </Link>

            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground text-sm">
              Leave them waiting until tomorrow
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
