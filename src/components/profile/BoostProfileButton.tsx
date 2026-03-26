// @ts-nocheck
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Zap, Shield, Crown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from '@/hooks/use-toast';

export default function BoostProfileButton({ userProfile, onBoostSuccess }: { userProfile: any; onBoostSuccess?: () => void }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

  const isVerified = userProfile?.verification_status?.id_verified || 
                     userProfile?.verification_status?.photo_verified;
  
  const hasActiveBoost = userProfile?.profile_boost_active && 
                         userProfile?.boost_expires_at && 
                         new Date(userProfile.boost_expires_at) > new Date();

  const handleBoost = async () => {
    if (!isVerified) {
      setError('You must be verified to boost your profile. Complete ID and photo verification first.');
      return;
    }
    setIsBoosting(true);
    setError('');
    try {
      const response = await base44.functions.invoke('boostProfile');
      if (response.data.success) {
        toast({ title: '🚀 Profile Boosted! Your profile will be shown to more people for 24 hours.' });
        setShowDialog(false);
        if (onBoostSuccess) onBoostSuccess();
      } else if (response.data.error) {
        if (response.data.limit_reached) setShowPaywall(true);
        else setError(response.data.error);
      }
    } catch (err: any) {
      console.error('Boost failed:', err);
      if (err.response?.data?.limit_reached) setShowPaywall(true);
      else setError(err.response?.data?.error || 'Failed to boost profile. Please try again.');
    } finally {
      setIsBoosting(false);
    }
  };

  const handlePurchaseBoost = () => {
    toast({ title: 'Payment will be available via in-app purchases.' });
  };

  const getTimeRemaining = () => {
    if (!hasActiveBoost) return null;
    const now = new Date();
    const expires = new Date(userProfile.boost_expires_at);
    const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    const minutesLeft = Math.floor(((expires.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursLeft}h ${minutesLeft}m`;
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant={hasActiveBoost ? "outline" : "default"}
        className={hasActiveBoost ? "border-primary text-primary" : ""}
        size="lg"
      >
        <Zap size={20} className={hasActiveBoost ? "fill-primary" : "fill-primary-foreground"} />
        <span className="ml-2">
          {hasActiveBoost ? `Boosted (${getTimeRemaining()})` : 'Boost Profile'}
        </span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Zap size={28} className="text-primary" />
              Boost Your Profile
            </DialogTitle>
            <DialogDescription>Get up to 10x more views for 24 hours</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!isVerified && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  <strong>Verification Required</strong><br />
                  You must be verified to boost. Please complete photo verification to unlock this feature.
                </AlertDescription>
              </Alert>
            )}

            {hasActiveBoost && (
              <Alert>
                <Clock className="h-5 w-5 text-primary" />
                <AlertDescription>
                  <strong>Boost Active</strong><br />
                  Your profile is currently boosted for {getTimeRemaining()} more.
                </AlertDescription>
              </Alert>
            )}

            {showPaywall ? (
              <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-foreground">Out of Boosts?</h3>
                  <p className="text-sm text-muted-foreground">You've used all your boosts for this month.</p>
                  <p className="text-base font-medium text-foreground mt-2">Get an instant 24h boost for just $5!</p>
                </div>
                <div className="space-y-3">
                  <Button onClick={handlePurchaseBoost} className="w-full font-bold">
                    Purchase Boost - $5.00
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">In-App Purchase</p>
                </div>
                <div className="text-center mt-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowPaywall(false)}>Back</Button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-foreground">Boost Benefits:</h4>
                  <div className="space-y-2">
                    {['Your profile appears first in discovery', 'Up to 10x more profile views', 'Shown to users in your area first', 'Active for 24 hours'].map((text, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle size={18} className="text-green-600 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Your Plan:</strong>{' '}
                    <Badge>{(userProfile?.subscription_tier || 'free').toUpperCase()}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {userProfile?.subscription_tier === 'vip' ? '∞ Unlimited boosts per month' :
                     userProfile?.subscription_tier === 'elite' ? '10 boosts per month' :
                     userProfile?.subscription_tier === 'premium' ? '5 boosts per month' :
                     '1 boost per month (upgrade for more!)'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleBoost} disabled={isBoosting || hasActiveBoost || !isVerified} className="flex-1">
                    {isBoosting ? 'Boosting...' : hasActiveBoost ? 'Already Boosted' : 'Boost Now'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
