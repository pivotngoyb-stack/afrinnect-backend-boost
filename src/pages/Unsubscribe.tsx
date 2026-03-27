import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2, Crown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Unsubscribe() {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/'); return; }
        const { data: profiles } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).limit(1);
        if (profiles && profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {
        navigate('/');
      }
    };
    fetchProfile();
  }, [navigate]);

  const { data: subscription } = useQuery({
    queryKey: ['active-subscription', myProfile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_profile_id', myProfile.id)
        .eq('status', 'active')
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!myProfile
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: subscription?.id, reason, feedback }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setCancelled(true);
    }
  });

  if (!myProfile || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle size={60} className="mx-auto mb-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Subscription Cancelled</h2>
            <p className="text-muted-foreground mb-6">
              Your premium features will remain active until{' '}
              <span className="font-semibold">
                {new Date(subscription.end_date).toLocaleDateString()}
              </span>
            </p>
            <Link to="/profile">
              <Button className="w-full">Go to Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">Cancel Subscription</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Are you sure you want to cancel? You'll lose access to all premium features.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown size={20} className="text-amber-600" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-semibold capitalize">
                {subscription.plan_type?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">
                ${subscription.amount_paid} {subscription.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Renewal Date</span>
              <span className="font-semibold">
                {new Date(subscription.end_date).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Help Us Improve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Why are you cancelling?</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="found_match">Found my match! ❤️</SelectItem>
                  <SelectItem value="too_expensive">Too expensive</SelectItem>
                  <SelectItem value="not_enough_matches">Not enough matches</SelectItem>
                  <SelectItem value="technical_issues">Technical issues</SelectItem>
                  <SelectItem value="taking_break">Taking a break</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Feedback (Optional)</Label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more..."
                rows={4}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-200">You'll Lose Access To:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-amber-800 dark:text-amber-300">
              <li>• Unlimited likes and super likes</li>
              <li>• Advanced filters (location, religion, etc.)</li>
              <li>• See who likes you</li>
              <li>• Profile boosts</li>
              <li>• Read receipts</li>
              <li>• Ad-free experience</li>
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={() => cancelMutation.mutate()}
            disabled={!reason || cancelMutation.isPending}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Cancelling...
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </Button>

          <Link to="/profile">
            <Button variant="outline" className="w-full" size="lg">
              Keep My Subscription
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
