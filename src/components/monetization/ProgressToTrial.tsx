import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Check, Crown, Star, Heart, MessageCircle, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';

const ACTIONS = [
  { id: 'profile_photo', label: 'Add profile photo', icon: User },
  { id: 'bio', label: 'Write your bio', icon: User },
  { id: 'first_like', label: 'Like someone', icon: Heart },
  { id: 'view_profiles', label: 'View 5 profiles', icon: Star },
  { id: 'send_message', label: 'Send a message', icon: MessageCircle },
];

const TOTAL_REQUIRED = 5;

interface ProgressToTrialProps {
  userProfile: { id: string; user_id: string; onboarding_actions?: string[] } | null;
  className?: string;
}

export default function ProgressToTrial({ userProfile, className = "" }: ProgressToTrialProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [hasActiveTrial, setHasActiveTrial] = useState(false);

  useEffect(() => {
    if (!userProfile) return;
    setCompletedActions(userProfile.onboarding_actions || []);

    // Check if user already has an active trial or subscription
    const checkSub = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('id, is_trial, trial_end, status')
        .eq('user_profile_id', userProfile.id)
        .in('status', ['active', 'trialing'])
        .limit(1);
      
      if (data && data.length > 0) setHasActiveTrial(true);
    };
    checkSub();
  }, [userProfile]);

  const actions = ACTIONS.map(a => ({
    ...a,
    completed: completedActions.includes(a.id),
  }));

  const completedCount = actions.filter(a => a.completed).length;
  const progress = (completedCount / TOTAL_REQUIRED) * 100;
  const isComplete = completedCount >= TOTAL_REQUIRED;

  // Don't show if user already has a subscription/trial or if user has no profile
  if (!userProfile || hasActiveTrial) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/30 dark:to-purple-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/30 overflow-hidden ${className}`}
    >
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center gap-3 hover:bg-card/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
          <Gift size={18} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Free Trial</span>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
              {completedCount}/{TOTAL_REQUIRED}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 bg-muted mt-1.5" />
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-amber-100 dark:border-amber-800/30">
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
                        action.completed 
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                          : 'bg-card/50 text-muted-foreground'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        action.completed ? 'bg-green-500' : 'bg-muted'
                      }`}>
                        {action.completed ? (
                          <Check size={10} className="text-white" />
                        ) : (
                          <Icon size={8} className="text-muted-foreground" />
                        )}
                      </div>
                      <span className={action.completed ? 'line-through' : ''}>
                        {action.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {isComplete ? (
                <Link to={createPageUrl('PricingPlans')}>
                  <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                    <Crown size={14} className="mr-1" />
                    Claim Free Trial!
                  </Button>
                </Link>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  {TOTAL_REQUIRED - completedCount} more to unlock premium trial
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
