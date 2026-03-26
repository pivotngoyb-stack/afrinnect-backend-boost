// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { createRecord, logout } from '@/lib/supabase-helpers';
import Logo from '@/components/shared/Logo';
import AfricanPattern from '@/components/shared/AfricanPattern';
import { toast } from '@/hooks/use-toast';

interface BannedScreenProps {
  userProfile?: { id: string } | null;
  banReason?: string;
  userEmail?: string;
}

export default function BannedScreen({ userProfile, banReason, userEmail }: BannedScreenProps) {
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      toast({ title: 'Please explain why you believe this ban is incorrect.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createRecord('disputes', {
        user_email: userEmail,
        user_profile_id: userProfile?.id || null,
        dispute_type: 'ban_appeal',
        reason: disputeReason,
        original_ban_reason: banReason || 'No reason provided',
        status: 'pending'
      });

      setSubmitted(true);
      setShowDispute(false);
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      toast({ title: 'Failed to submit dispute. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/10 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative">
      <AfricanPattern className="text-destructive" opacity={0.05} />

      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-8">
          <Logo size="large" />
        </div>

        <Card className="border-destructive/30 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-destructive to-orange-600 text-destructive-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <ShieldX size={32} />
              Account Suspended
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <AlertDescription className="text-destructive font-medium">
                Your account has been suspended and you cannot access Afrinnect at this time.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">Reason for suspension:</p>
              <p className="text-foreground">{banReason || 'Violation of community guidelines'}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">What this means:</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>You cannot access your profile or use any Afrinnect features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>Your profile is hidden from other users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>All matches and conversations are paused</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">•</span>
                  <span>This suspension may be temporary or permanent depending on the violation</span>
                </li>
              </ul>
            </div>

            {submitted && (
              <Alert className="bg-green-50 border-green-300">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-900">
                  Your appeal has been submitted successfully. Our team will review it within 24-48 hours and contact you via email.
                </AlertDescription>
              </Alert>
            )}

            {showDispute && !submitted && (
              <div className="space-y-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare size={20} />
                  File an Appeal
                </h3>
                <p className="text-sm text-muted-foreground">
                  If you believe this suspension is a mistake or you'd like to explain your situation, please provide details below:
                </p>
                <Textarea
                  placeholder="Explain why you believe this suspension is incorrect or provide context about your situation..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={6}
                  className="w-full"
                />
                <div className="flex gap-3">
                  <Button onClick={handleSubmitDispute} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDispute(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!showDispute && !submitted && (
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={() => setShowDispute(true)} className="w-full gap-2">
                  <MessageSquare size={18} />
                  File an Appeal
                </Button>
                <Button variant="outline" onClick={() => logout()} className="w-full">
                  Logout
                </Button>
              </div>
            )}

            {submitted && (
              <Button variant="outline" onClick={() => logout()} className="w-full">
                Logout
              </Button>
            )}

            <div className="text-center pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Need immediate help? Email us at{' '}
                <a href="mailto:support@afrinnect.com" className="text-primary hover:underline font-medium">
                  support@afrinnect.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Afrinnect. All rights reserved.
        </p>
      </div>
    </div>
  );
}
