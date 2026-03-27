import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Globe, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface GuidedActionsProps {
  hasCompletedProfile?: boolean;
  hasJoinedCommunity?: boolean;
}

export default function GuidedActions({ hasCompletedProfile, hasJoinedCommunity }: GuidedActionsProps) {
  const navigate = useNavigate();

  const actions = [
    ...(!hasCompletedProfile ? [{
      icon: <User size={18} />,
      label: 'Complete your profile',
      description: 'Add photos and bio to get more matches',
      action: () => navigate('/editprofile'),
      color: 'bg-primary/10 text-primary',
    }] : []),
    {
      icon: <Globe size={18} />,
      label: 'Explore people near you',
      description: 'Discover profiles from the diaspora',
      action: () => navigate('/home'),
      color: 'bg-accent/50 text-accent-foreground',
    },
    ...(!hasJoinedCommunity ? [{
      icon: <Users size={18} />,
      label: 'Join your first community',
      description: 'Connect with people who share your culture',
      action: () => {},
      color: 'bg-secondary text-secondary-foreground',
    }] : []),
  ];

  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Quick Start
      </p>
      {actions.map((a, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={a.action}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors text-left group"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
            {a.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{a.label}</p>
            <p className="text-xs text-muted-foreground">{a.description}</p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </motion.button>
      ))}
    </div>
  );
}
