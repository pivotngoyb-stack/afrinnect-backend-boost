// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
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

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const reasons = [
    "Found someone special",
    "Taking a break from dating",
    "Not enough matches",
    "Privacy concerns",
    "Too many notifications",
    "App performance issues",
    "Moving to another app",
    "Other"
  ];

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    
    try {
      // Get current session to ensure we have a valid token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to delete your account.');
      }

      const { data, error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { reason, confirmDelete: true }
      });
      
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      
      // Logout and redirect - use navigate for native app compatibility
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
      setShowFinalConfirm(false);
    }
  };

  const canProceed = confirmText.toLowerCase() === 'delete my account';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <CardDescription>This action cannot be undone</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-semibold text-destructive mb-2">What will be permanently deleted:</h3>
              <ul className="text-sm text-destructive/80 space-y-1">
                <li>• Your profile and all photos</li>
                <li>• All matches and conversations</li>
                <li>• Likes and connections</li>
                <li>• Subscription and payment history</li>
                <li>• Any Founding Member or Ambassador status</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Why are you leaving? (Optional)
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-destructive focus:border-destructive"
              >
                <option value="">Select a reason...</option>
                {reasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type <span className="font-bold text-destructive">"delete my account"</span> to confirm:
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={() => setShowFinalConfirm(true)}
              disabled={!canProceed}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              If you have an active subscription, it will be cancelled immediately with no refund.
            </p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. 
              You will not be able to recover any information after this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
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
