// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, Users, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Logo from '@/components/shared/Logo';
import { toast } from '@/hooks/use-toast';

export default function LegalAcceptance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accepted, setAccepted] = useState({
    terms: false,
    privacy: false,
    guidelines: false
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          navigate('/login');
          return;
        }
        setUser(authUser);
        
        // Check if already accepted
        const { data: acceptances } = await supabase
          .from('legal_acceptances')
          .select('id')
          .eq('user_id', authUser.id)
          .limit(1);
        
        if (acceptances && acceptances.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', authUser.id)
            .limit(1);
          navigate(profiles && profiles.length > 0 ? '/home' : '/onboarding');
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        navigate('/login');
      }
    };
    checkUser();
  }, [navigate]);

  const handleAccept = async () => {
    if (!user) return;
    
    if (!accepted.terms || !accepted.privacy || !accepted.guidelines) {
      toast({ title: 'Please accept all agreements to continue', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('accept-legal-terms', {
        body: {
          terms_version: "1.0",
          privacy_version: "1.0", 
          guidelines_version: "1.0"
        }
      });
      if (error) throw error;
      navigate('/onboarding');
    } catch (error) {
      console.error("Failed to accept terms:", error);
      toast({ title: "Something went wrong. Please try again.", variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-amber-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-card border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-amber-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <Logo size="large" />
          <h1 className="text-3xl font-bold text-white mt-4 mb-2">Welcome to Afrinnect</h1>
          <p className="text-white/80">Before we begin, please review and accept our policies</p>
        </div>

        <Card className="bg-card/10 backdrop-blur-lg border-card/20">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card/10 rounded-xl">
                <Checkbox
                  id="terms"
                  checked={accepted.terms}
                  onCheckedChange={(checked) => setAccepted(prev => ({ ...prev, terms: checked }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={20} className="text-amber-400" />
                    <label htmlFor="terms" className="font-semibold text-white cursor-pointer">
                      Terms of Service
                    </label>
                  </div>
                  <p className="text-sm text-white/70 mb-2">
                    Our rules for using Afrinnect, including account responsibilities and prohibited conduct.
                  </p>
                  <Link to="/terms" target="_blank">
                    <Button variant="link" className="text-amber-400 p-0 h-auto">
                      Read Full Terms →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/10 rounded-xl">
                <Checkbox
                  id="privacy"
                  checked={accepted.privacy}
                  onCheckedChange={(checked) => setAccepted(prev => ({ ...prev, privacy: checked }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={20} className="text-green-400" />
                    <label htmlFor="privacy" className="font-semibold text-white cursor-pointer">
                      Privacy Policy
                    </label>
                  </div>
                  <p className="text-sm text-white/70 mb-2">
                    How we collect, use, and protect your personal information and data.
                  </p>
                  <Link to="/privacy" target="_blank">
                    <Button variant="link" className="text-green-400 p-0 h-auto">
                      Read Privacy Policy →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card/10 rounded-xl">
                <Checkbox
                  id="guidelines"
                  checked={accepted.guidelines}
                  onCheckedChange={(checked) => setAccepted(prev => ({ ...prev, guidelines: checked }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={20} className="text-blue-400" />
                    <label htmlFor="guidelines" className="font-semibold text-white cursor-pointer">
                      Community Guidelines
                    </label>
                  </div>
                  <p className="text-sm text-white/70 mb-2">
                    Standards for respectful behavior and safety in our community.
                  </p>
                  <Link to="/communityguidelines" target="_blank">
                    <Button variant="link" className="text-blue-400 p-0 h-auto">
                      Read Guidelines →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAccept}
              disabled={!accepted.terms || !accepted.privacy || !accepted.guidelines || !user}
              className="w-full py-6 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={20} className="mr-2" />
              I Accept - Continue
            </Button>

            <p className="text-center text-white/60 text-xs">
              By continuing, you confirm you are at least 18 years old and agree to these policies.
              You can withdraw consent or delete your account at any time in Settings.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
