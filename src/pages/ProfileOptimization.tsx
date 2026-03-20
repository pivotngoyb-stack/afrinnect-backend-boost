import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Sparkles, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ProfileAnalysis {
  overall_score: number;
  strengths: string[];
  improvements: string[];
  specific_tips: string[];
}

export default function ProfileOptimization() {
  const [myProfile, setMyProfile] = useState<any>(null);
  const [aiTips, setAiTips] = useState<ProfileAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
        if (profiles && profiles.length > 0) setMyProfile(profiles[0]);
      } catch (e) {
        console.error('Failed to fetch profile:', e);
      }
    };
    fetchProfile();
  }, []);

  const analyzeProfile = async () => {
    if (!myProfile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('profile-optimization', {
        body: { profile: myProfile },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiTips(data as ProfileAnalysis);
    } catch (e: any) {
      toast({
        title: "Analysis failed",
        description: e.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 pb-24">
      <header className="bg-background/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Profile')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Profile Optimization</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {!aiTips ? (
          <Card className="text-center">
            <CardContent className="p-8">
              <Sparkles size={64} className="mx-auto text-primary mb-4" />
              <h2 className="text-xl font-bold mb-2">AI Profile Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Get personalized tips to improve your profile and get more matches
              </p>
              <Button 
                onClick={analyzeProfile}
                disabled={loading || !myProfile}
                className="bg-primary"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze My Profile'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {aiTips.overall_score}/100
                  </div>
                  <p className="text-muted-foreground">Profile Score</p>
                </div>
                <Progress value={aiTips.overall_score} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={20} className="text-green-600" />
                  <h3 className="font-semibold">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {aiTips.strengths?.map((strength, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-amber-600" />
                  <h3 className="font-semibold">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {aiTips.improvements?.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-amber-600">→</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-primary" />
                  <h3 className="font-semibold">Specific Tips</h3>
                </div>
                <ul className="space-y-3">
                  {aiTips.specific_tips?.map((tip, idx) => (
                    <li key={idx} className="p-3 bg-primary/5 rounded-lg text-sm">
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => { setAiTips(null); }}
                variant="outline"
                className="flex-1"
              >
                <Sparkles size={16} className="mr-2" />
                Re-analyze
              </Button>
              <Link to={createPageUrl('EditProfile')} className="flex-1">
                <Button className="w-full">Edit Profile</Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
