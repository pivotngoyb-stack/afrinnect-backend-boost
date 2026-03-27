import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const rateLimitStore = new Map<string, any>();

export function useRateLimit(key: string, maxAttempts = 5, windowMs = 60000) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const data = rateLimitStore.get(key);
    if (data?.blockedUntil && Date.now() < data.blockedUntil) {
      setIsBlocked(true);
      setRemainingTime(Math.ceil((data.blockedUntil - Date.now()) / 1000));
    }
  }, [key]);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) { setIsBlocked(false); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const checkLimit = () => {
    const now = Date.now();
    const data = rateLimitStore.get(key) || { attempts: [] as number[], blockedUntil: null };
    data.attempts = data.attempts.filter((t: number) => now - t < windowMs);
    if (data.blockedUntil && now < data.blockedUntil) return false;
    if (data.attempts.length >= maxAttempts) {
      data.blockedUntil = now + windowMs;
      rateLimitStore.set(key, data);
      setIsBlocked(true);
      setRemainingTime(Math.ceil(windowMs / 1000));
      return false;
    }
    data.attempts.push(now);
    rateLimitStore.set(key, data);
    return true;
  };

  return { isBlocked, remainingTime, checkLimit };
}

export function RateLimitWarning({ isBlocked, remainingTime }: { isBlocked: boolean; remainingTime: number }) {
  if (!isBlocked) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} className="text-red-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">Too many attempts</p>
          <p className="text-xs text-red-700">Please wait {remainingTime} seconds before trying again</p>
        </div>
        <Clock size={18} className="text-red-600" />
      </div>
    </motion.div>
  );
}
