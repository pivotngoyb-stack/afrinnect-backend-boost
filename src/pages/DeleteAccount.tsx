// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Pause, Trash2, Loader2, Shield, Heart, MessageCircle, Star, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const GRACE_PERIOD_DAYS = 30;

const reasons = [
  { id: 'found_someone', label: 'I found someone', icon: Heart },
  { id: 'break', label: 'Taking a break', icon: Pause },
  { id: 'not_enough_matches', label: 'Not enough matches', icon: Star },
  { id: 'privacy', label: 'Privacy concerns', icon: Shield },
  { id: 'other_app', label: 'Using another app', icon: MessageCircle },
  { id: 'other', label: 'Other', icon: ChevronRight },
];

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'reason' | 'confirm' | 'final'>('reason');
  const [selectedReason, setSelectedReason] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [error, setError] = useState(null);

  const handlePause = async () => {
    setIsPausing(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('You must be logged in.');

      const { data, error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { pauseInstead: true }
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      toast.success('Account paused! You won\'t appear in discovery.');
      navigate('/settings', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPausing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('You must be logged in to delete your account.');

      const { data, error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { reason: selectedReason, confirmDelete: true }
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.message || 'Failed to delete account.');
      setIsDeleting(false);
      setShowFinalConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => step === 'reason' ? navigate(-1) : setStep('reason')} className="p-1">
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Delete Account</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Reason selection */}
        {step === 'reason' && (
          <>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">We're sorry to see you go</h2>
              <p className="text-muted-foreground text-sm">
                Before you leave, can you tell us why?
              </p>
            </div>

            <div className="space-y-2">
              {reasons.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedReason(r.label);
                      setStep('confirm');
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      selectedReason === r.label 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-card hover:bg-accent/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-muted-foreground" />
                    </div>
                    <span className="text-foreground font-medium flex-1">{r.label}</span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: Pause or Delete */}
        {step === 'confirm' && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">Have you considered pausing?</h2>
              <p className="text-muted-foreground text-sm">
                You can hide your profile and come back anytime — no data lost.
              </p>
            </div>

            {/* Pause option - highlighted */}
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Pause size={22} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Pause My Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Hide from discovery. Keep everything.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handlePause}
                  disabled={isPausing}
                  className="w-full"
                >
                  {isPausing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pause className="mr-2 h-4 w-4" />}
                  Pause Instead
                </Button>
              </CardContent>
            </Card>

            {/* Delete option */}
            <Card className="border-destructive/20">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 size={22} className="text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-destructive">Delete My Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Your account will be permanently deleted after {GRACE_PERIOD_DAYS} days.
                    </p>
                  </div>
                </div>

                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-destructive">What will happen:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Profile hidden immediately from discovery</li>
                    <li>• {GRACE_PERIOD_DAYS}-day grace period to change your mind</li>
                    <li>• After {GRACE_PERIOD_DAYS} days: all data permanently deleted</li>
                    <li>• Photos, matches, messages — everything erased</li>
                    <li>• Active subscriptions cancelled with no refund</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setShowFinalConfirm(true)}
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </Button>
              </CardContent>
            </Card>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Final confirmation dialog */}
      <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Your profile will be hidden immediately and permanently deleted 
                after {GRACE_PERIOD_DAYS} days. You can log back in during this period 
                to reactivate your account.
              </p>
              <p className="font-medium text-foreground">
                After {GRACE_PERIOD_DAYS} days, this cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Keep My Account</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes, Delete Everything'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
