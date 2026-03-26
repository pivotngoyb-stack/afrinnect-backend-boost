// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, User, MessageSquare, Camera,
  Shield, Loader2, CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

const REPORT_TYPES = [
  { value: 'fake_profile', label: 'Fake Profile', icon: User, description: 'This person is pretending to be someone else' },
  { value: 'harassment', label: 'Harassment', icon: MessageSquare, description: 'Sending unwanted or abusive messages' },
  { value: 'inappropriate_content', label: 'Inappropriate Content', icon: Camera, description: 'Explicit photos or offensive content' },
  { value: 'scam', label: 'Scam / Fraud', icon: AlertTriangle, description: 'Asking for money or suspicious behavior' },
  { value: 'underage', label: 'Underage User', icon: Shield, description: 'This person appears to be under 18' },
  { value: 'hate_speech', label: 'Hate Speech', icon: AlertTriangle, description: 'Discriminatory or hateful content' },
  { value: 'other', label: 'Other', icon: AlertTriangle, description: 'Something else not listed above' }
];

export default function Report() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [myProfile, setMyProfile] = useState(null);
  const [reportedProfile, setReportedProfile] = useState(null);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, user_id, display_name')
          .eq('user_id', user.id)
          .limit(1);
        if (profiles?.[0]) setMyProfile(profiles[0]);

        if (userId) {
          const { data: reported } = await supabase
            .from('user_profiles')
            .select('id, display_name, primary_photo')
            .eq('id', userId)
            .limit(1);
          if (reported?.[0]) setReportedProfile(reported[0]);
        }
      } catch (e) {
        console.error('Error fetching data');
      }
    };
    fetchData();
  }, [userId, navigate]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('submit-report', {
        body: {
          reported_id: userId,
          report_type: reportType,
          description
        }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => setSubmitted(true),
    onError: (error: any) => toast.error(error.message || 'Failed to submit report. Please try again.'),
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Report Submitted</h2>
          <p className="text-muted-foreground mb-4">Thank you for helping keep Afrinnect safe.</p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">What Happens Next:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2"><CheckCircle size={16} className="flex-shrink-0 mt-0.5" /><span>Our safety team reviews your report within 24 hours</span></li>
              <li className="flex items-start gap-2"><CheckCircle size={16} className="flex-shrink-0 mt-0.5" /><span>Violating accounts are warned, suspended, or banned</span></li>
              <li className="flex items-start gap-2"><CheckCircle size={16} className="flex-shrink-0 mt-0.5" /><span>The reported user won't know who reported them</span></li>
            </ul>
          </div>
          <Button onClick={() => navigate('/communities')} className="bg-primary hover:bg-primary/90">
            Back to Community
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Report User</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Shield className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-amber-800 text-sm">Your Safety Matters</h3>
            <p className="text-amber-700 text-sm mt-1">Reports are anonymous. The reported user won't know who submitted the report.</p>
          </div>
        </div>

        {reportedProfile && (
          <Card className="mb-6 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <img
                src={reportedProfile.primary_photo || '/placeholder.svg'}
                alt={reportedProfile.display_name}
                className="w-14 h-14 rounded-full object-cover bg-muted"
              />
              <div>
                <p className="text-sm text-muted-foreground">Reporting:</p>
                <h3 className="font-semibold text-foreground">{reportedProfile.display_name}</h3>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <Label className="text-base font-semibold mb-4 block text-foreground">What's the issue?</Label>
          <RadioGroup value={reportType} onValueChange={setReportType}>
            <div className="space-y-3">
              {REPORT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                    reportType === type.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <RadioGroupItem value={type.value} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <type.icon size={16} className={reportType === type.value ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="font-medium text-foreground">{type.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="mb-6">
          <Label className="text-base font-semibold mb-2 block text-foreground">Additional Details</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide any additional information..."
            rows={4}
          />
        </div>

        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!reportType || !description || submitMutation.isPending}
          className="w-full bg-destructive hover:bg-destructive/90"
          size="lg"
        >
          {submitMutation.isPending ? (
            <><Loader2 size={18} className="animate-spin mr-2" />Submitting...</>
          ) : (
            'Submit Report'
          )}
        </Button>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Report?</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to report {reportedProfile?.display_name || 'this user'} for {REPORT_TYPES.find(t => t.value === reportType)?.label?.toLowerCase() || 'a violation'}. Our safety team will review this within 24 hours.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => submitMutation.mutate()} className="bg-destructive hover:bg-destructive/90">
                Submit Report
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-center text-muted-foreground text-xs mt-4">
          False reports may result in action against your account
        </p>
      </main>
    </div>
  );
}
