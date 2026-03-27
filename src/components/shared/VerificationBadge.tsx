import React from 'react';
import { Shield, Camera } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  verification?: { photo_verified?: boolean; id_verified?: boolean } | null;
  size?: 'small' | 'default';
  // Legacy props
  verified?: boolean;
  type?: string;
  className?: string;
}

export default function VerificationBadge({ verification, size = "default", verified, type, className = '' }: VerificationBadgeProps) {
  const iconSize = size === "small" ? 14 : 18;

  // Legacy mode
  if (verified !== undefined) {
    if (!verified) return null;
    return (
      <div className={`bg-primary rounded-full p-1 ${className}`}>
        <Camera size={iconSize} className="text-primary-foreground" />
      </div>
    );
  }

  if (!verification) return null;
  const { photo_verified, id_verified } = verification;
  if (!photo_verified && !id_verified) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {photo_verified && (
          <Tooltip>
            <TooltipTrigger>
              <div className="bg-primary rounded-full p-1">
                <Camera size={iconSize} className="text-primary-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Photo Verified</p>
            </TooltipContent>
          </Tooltip>
        )}
        {id_verified && (
          <Tooltip>
            <TooltipTrigger>
              <div className="bg-emerald-500 rounded-full p-1">
                <Shield size={iconSize} className="text-primary-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>ID Verified</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
