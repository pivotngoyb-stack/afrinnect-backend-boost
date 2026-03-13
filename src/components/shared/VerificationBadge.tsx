// @ts-nocheck
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface VerificationBadgeProps {
  verified?: boolean;
  type?: string;
  size?: number;
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ 
  verified = false, 
  type = 'photo',
  size = 16,
  className = '' 
}) => {
  if (!verified) return null;
  
  return (
    <CheckCircle 
      size={size} 
      className={`text-blue-500 ${className}`}
      fill="currentColor"
      strokeWidth={0}
    />
  );
};

export default VerificationBadge;
