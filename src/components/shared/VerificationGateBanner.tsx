// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VerificationGateBannerProps {
  matchCount: number;
}

export default function VerificationGateBanner({ matchCount }: VerificationGateBannerProps) {
  const navigate = useNavigate();

  return (
    <Alert className="border-destructive/50 bg-destructive/10 mx-4 my-4">
      <ShieldAlert className="h-5 w-5 text-destructive" />
      <AlertDescription className="ml-2">
        <p className="font-semibold text-foreground mb-1">Photo Verification Required</p>
        <p className="text-sm text-muted-foreground mb-3">
          You've reached {matchCount} matches! To continue liking, swiping, and messaging, 
          please verify your identity with a quick photo check.
        </p>
        <Button size="sm" onClick={() => navigate('/verifyphoto')} className="gap-2">
          <Camera size={16} />
          Verify Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
