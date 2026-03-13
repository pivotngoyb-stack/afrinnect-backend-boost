// @ts-nocheck
import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';

interface FoundingMemberBadgeProps {
  profile: any;
  size?: 'small' | 'default' | 'large';
  showTooltip?: boolean;
  variant?: 'badge' | 'inline' | 'frame';
}

export default function FoundingMemberBadge({ profile, size = 'default', showTooltip = true, variant = 'badge' }: FoundingMemberBadgeProps) {
  if (!profile?.is_founding_member) return null;

  const trialEndsAt = profile.founding_member_trial_ends_at ? new Date(profile.founding_member_trial_ends_at) : null;
  const isTrialActive = trialEndsAt && trialEndsAt > new Date();

  const badgeContent = (
    <div className={`inline-flex items-center gap-1 ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'}`}>
      <Crown size={size === 'small' ? 12 : size === 'large' ? 18 : 14} className="text-accent" />
      <span className="font-semibold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">Founding Member</span>
    </div>
  );

  if (variant === 'badge') {
    const badge = (
      <Badge className={`bg-accent/10 border border-accent/30 text-accent-foreground hover:bg-accent/20 cursor-default ${size === 'small' ? 'px-1.5 py-0.5' : size === 'large' ? 'px-4 py-2' : 'px-2 py-1'}`}>
        {badgeContent}
      </Badge>
    );
    if (!showTooltip) return badge;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Crown size={16} className="text-accent" />
                <span className="font-bold">Founding Member</span>
              </div>
              <p className="text-xs text-muted-foreground">Early supporter with exclusive premium access</p>
              {isTrialActive && trialEndsAt && (
                <p className="text-xs text-accent mt-1">Premium until {format(trialEndsAt, 'MMM d, yyyy')}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-accent">
        <Crown size={size === 'small' ? 10 : 12} />
        <span className="text-xs font-medium">Founder</span>
      </span>
    );
  }

  if (variant === 'frame') {
    return (
      <div className="absolute -top-1 -right-1 z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-sm animate-pulse" />
          <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 rounded-full p-1.5 shadow-lg">
            <Crown size={size === 'small' ? 10 : 14} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  return badgeContent;
}

export function FoundingMemberIcon({ size = 14 }: { size?: number }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-sm">
            <Crown size={size} className="text-white" />
          </div>
        </TooltipTrigger>
        <TooltipContent><span>Founding Member</span></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
