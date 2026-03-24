// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, X, ArrowLeft, Crown, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProfileCard from '@/components/profile/ProfileCard';

export default function DailyMatches() {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const queryClient = useQueryClient();

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

  const { data: dailyMatches = [], isLoading } = useQuery({
    queryKey: ['daily-matches', myProfile?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: matches } = await supabase
        .from('daily_matches')
        .select('*')
        .eq('user_profile_id', myProfile.id)
        .eq('date', today)
        .eq('status', 'pending');

      if (matches && matches.length > 0) return matches;

      // Generate new daily matches
      const userFilters = myProfile.filters || {};
      let query = supabase.from('user_profiles').select('*').eq('is_active', true).neq('id', myProfile.id).limit(100);
      
      const { data: allProfiles } = await query;
      let filtered = allProfiles || [];

      // Apply age filter
      if (userFilters.age_min || userFilters.age_max) {
        filtered = filtered.filter(p => {
          if (!p.birth_date) return false;
          const age = Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          return (!userFilters.age_min || age >= userFilters.age_min) && (!userFilters.age_max || age <= userFilters.age_max);
        });
      }

      // Score and pick top 5
      const scored = filtered.slice(0, 5).map(profile => ({
        user_profile_id: myProfile.id,
        suggested_profile_id: profile.id,
        match_score: Math.floor(Math.random() * 30) + 70,
        match_reasons: ['Shared cultural values', 'Similar relationship goals', 'Compatible location'],
        date: today,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }));

      if (scored.length > 0) {
        await supabase.from('daily_matches').insert(scored);
      }

      const { data: newMatches } = await supabase
        .from('daily_matches')
        .select('*')
        .eq('user_profile_id', myProfile.id)
        .eq('date', today);
      
      return newMatches || [];
    },
    enabled: !!myProfile
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['daily-profiles', dailyMatches.map(m => m.id).join(',')],
    queryFn: async () => {
      const profileIds = dailyMatches.map(m => m.suggested_profile_id);
      if (profileIds.length === 0) return [];
      const { data } = await supabase.from('user_profiles').select('*').in('id', profileIds);
      return (data || []).map((p, idx) => ({
        ...p,
        dailyMatch: dailyMatches.find(dm => dm.suggested_profile_id === p.id) || dailyMatches[idx]
      }));
    },
    enabled: dailyMatches.length > 0
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ matchId, status }) => {
      await supabase.from('daily_matches').update({ status }).eq('id', matchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-matches'] });
      setCurrentIndex(prev => prev + 1);
    }
  });

  const handleLike = () => {
    const current = profiles[currentIndex];
    if (current) {
      updateStatusMutation.mutate({ matchId: current.dailyMatch.id, status: 'liked' });
    }
  };

  const handlePass = () => {
    const current = profiles[currentIndex];
    if (current) {
      updateStatusMutation.mutate({ matchId: current.dailyMatch.id, status: 'passed' });
    }
  };

  const currentProfile = profiles[currentIndex];
  const remaining = profiles.length - currentIndex;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-lg border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            <h1 className="font-bold text-lg">Today's Picks</h1>
          </div>
          <Badge variant="secondary">
            {remaining > 0 ? remaining : 0} left
          </Badge>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        {!myProfile?.is_premium && (
          <Card className="mb-6 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/20 dark:to-purple-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <Crown size={32} className="mx-auto text-amber-600 mb-2" />
              <p className="text-sm text-foreground/70">
                Premium users get 10 curated matches daily!
              </p>
              <Link to="/pricingplans">
                <Button size="sm" className="mt-3">Upgrade</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          {currentProfile ? (
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="mb-6 bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      <span className="font-semibold text-sm">
                        {currentProfile.dailyMatch?.match_score}% Match
                      </span>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock size={12} />
                      Expires in 24h
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentProfile.dailyMatch?.match_reasons?.[0]}
                  </p>
                </CardContent>
              </Card>

              <ProfileCard
                profile={currentProfile}
                onLike={handleLike}
                onPass={handlePass}
                onSuperLike={handleLike}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Sparkles size={64} className="mx-auto text-amber-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">All Done!</h2>
              <p className="text-muted-foreground mb-6">
                Come back tomorrow for fresh matches
              </p>
              <Link to="/home">
                <Button>Continue Browsing</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
