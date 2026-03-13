import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import Logo from "@/components/shared/Logo";
import AfricanPattern from "@/components/shared/AfricanPattern";

interface BannedScreenProps {
  userProfile?: { id: string };
  banReason?: string;
  userEmail?: string;
}

export default function BannedScreen({ userProfile, banReason, userEmail }: BannedScreenProps) {
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      alert("Please explain why you believe this ban is incorrect.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Replace with Supabase insert once Cloud is enabled
      // await supabase.from('disputes').insert({
      //   user_email: userEmail,
      //   user_profile_id: userProfile?.id || null,
      //   dispute_type: 'ban_appeal',
      //   reason: disputeReason,
      //   original_ban_reason: banReason || 'No reason provided',
      //   status: 'pending'
      // });
      console.log("[BannedScreen] Dispute submission not yet connected to backend");
      setSubmitted(true);
      setShowDispute(false);
    } catch (error) {
      console.error("Failed to submit dispute:", error);
      alert("Failed to submit dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    // TODO: Replace with Supabase auth signOut
    // await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4 relative">
      <AfricanPattern className="text-red-600" opacity={0.05} />

      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-8">
          <Logo size="large" />
        </div>

        <Card className="border-red-300 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <ShieldX size={32} />
              Account Suspended
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Alert className="bg-red-50 border-red-300">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900 font-medium">
                Your account has been suspended and you cannot access Afrinnect at this time.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2 font-semibold">Reason for suspension:</p>
              <p>{banReason || "Violation of community guidelines"}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What this means:</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span><span>You cannot access your profile or use any Afrinnect features</span></li>
                <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span><span>Your profile is hidden from other users</span></li>
                <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span><span>All matches and conversations are paused</span></li>
                <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span><span>This suspension may be temporary or permanent</span></li>
              </ul>
            </div>

            {submitted && (
              <Alert className="bg-green-50 border-green-300">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-900">
                  Your appeal has been submitted successfully. Our team will review it within 24-48 hours.
                </AlertDescription>
              </Alert>
            )}

            {showDispute && !submitted && (
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare size={20} />
                  File an Appeal
                </h3>
                <p className="text-sm text-muted-foreground">
                  If you believe this suspension is a mistake, please provide details below:
                </p>
                <Textarea
                  placeholder="Explain why you believe this suspension is incorrect..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={6}
                  className="w-full"
                />
                <div className="flex gap-3">
                  <Button onClick={handleSubmitDispute} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Appeal"}
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
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </div>
            )}

            {submitted && (
              <Button variant="outline" onClick={handleLogout} className="w-full">
                Logout
              </Button>
            )}

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need immediate help? Email us at{" "}
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
