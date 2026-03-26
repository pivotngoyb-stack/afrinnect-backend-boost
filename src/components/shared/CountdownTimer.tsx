// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        onExpire?.();
        return false;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      return true;
    };

    const shouldContinue = calculateTime();
    if (!shouldContinue) return;

    const timer = setInterval(() => {
      if (!calculateTime()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (!timeLeft) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-destructive text-destructive-foreground rounded-full text-xs font-medium shadow-lg">
      <Clock size={12} className="animate-pulse" />
      <span>{timeLeft}</span>
    </div>
  );
}
