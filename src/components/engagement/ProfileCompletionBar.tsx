import React from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Heart, CheckCircle2, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/i18n/LanguageContext';

interface ProfileCompletionBarProps {
  userProfile: any;
  className?: string;
}

export default function ProfileCompletionBar({ userProfile, className = '' }: ProfileCompletionBarProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  if (!userProfile) return null;

  const tasks = [
    { key: 'photo', label: t('engagement.profileCompletion.addPhoto'), weight: 25, done: !!userProfile.primary_photo, icon: Camera },
    { key: 'bio', label: t('engagement.profileCompletion.writeBio'), weight: 20, done: !!userProfile.bio && userProfile.bio.length > 10, icon: User },
    { key: 'interests', label: t('engagement.profileCompletion.selectInterests'), weight: 15, done: userProfile.interests?.length >= 3, icon: Heart },
    { key: 'photos', label: t('engagement.profileCompletion.addPhotos'), weight: 15, done: userProfile.photos?.length >= 3, icon: Camera },
    { key: 'location', label: t('engagement.profileCompletion.setLocation'), weight: 10, done: !!userProfile.current_country, icon: CheckCircle2 },
    { key: 'goal', label: t('engagement.profileCompletion.setGoal'), weight: 15, done: !!userProfile.relationship_goal, icon: Heart },
  ];

  const completion = tasks.reduce((sum, tk) => sum + (tk.done ? tk.weight : 0), 0);
  const incomplete = tasks.filter(tk => !tk.done);

  if (completion >= 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-3 mb-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">
          {t('engagement.profileCompletion.percent').replace('{pct}', String(completion))}
        </p>
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          {completion < 50 ? t('engagement.dailyReturn.completeForMatches') : t('engagement.dailyReturn.almostThere')}
        </span>
      </div>
      <Progress value={completion} className="h-2 mb-2" />
      {incomplete.length > 0 && (() => {
        const TaskIcon = incomplete[0].icon;
        return (
          <button onClick={() => navigate('/edit-profile')} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 hover:underline mt-1">
            <TaskIcon size={14} />
            <span>{incomplete[0].label}</span>
            <ChevronRight size={12} />
          </button>
        );
      })()}
    </motion.div>
  );
}
