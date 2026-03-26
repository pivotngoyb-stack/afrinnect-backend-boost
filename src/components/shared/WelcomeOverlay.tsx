// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Users, Heart, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeOverlayProps {
  displayName?: string;
  onDismiss: () => void;
}

export default function WelcomeOverlay({ displayName, onDismiss }: WelcomeOverlayProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 2) setStep(s => s + 1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [step]);

  const steps = [
    {
      icon: <Globe className="text-primary" size={32} />,
      title: `Welcome${displayName ? `, ${displayName}` : ''} 🎉`,
      subtitle: 'Your community is already here',
    },
    {
      icon: <Users className="text-primary" size={32} />,
      title: 'People are waiting to connect',
      subtitle: 'Join communities, explore profiles, and find your tribe',
    },
    {
      icon: <Heart className="text-primary" size={32} />,
      title: "Let's get started",
      subtitle: 'Your first 60 seconds start now',
    },
  ];

  const current = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
      >
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
        >
          <X size={20} />
        </button>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            {current.icon}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{current.title}</h1>
          <p className="text-muted-foreground mb-8">{current.subtitle}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {step === 2 ? (
            <Button onClick={onDismiss} size="lg" className="gap-2">
              Explore Afrinnect <ArrowRight size={18} />
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="text-muted-foreground">
              Skip
            </Button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
