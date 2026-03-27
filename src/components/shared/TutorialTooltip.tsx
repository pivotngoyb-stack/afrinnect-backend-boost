import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface TutorialStep {
  icon: string;
  title: string;
  description: string;
}

interface TutorialTooltipProps {
  steps: TutorialStep[];
  onComplete: () => void;
}

export default function TutorialTooltip({ steps, onComplete }: TutorialTooltipProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShow(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    setShow(false);
    onComplete();
  };

  if (!show || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-foreground/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>

          <div className="text-6xl mb-4">{step.icon}</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{step.title}</h2>
          <p className="text-muted-foreground mb-6">{step.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
              {currentStep < steps.length - 1 ? (
                <>
                  Next <ArrowRight size={16} className="ml-2" />
                </>
              ) : (
                'Got it!'
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
