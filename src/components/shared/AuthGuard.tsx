// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  requireProfile = false,
  redirectTo = '/login'
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!requireAuth) {
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate(redirectTo + '?next=' + encodeURIComponent(window.location.pathname));
          return;
        }

        setAuthenticated(true);

        if (requireProfile) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (!profiles || profiles.length === 0) {
            navigate('/onboarding');
            return;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate(redirectTo);
      }
    };

    checkAuth();
  }, [requireAuth, requireProfile, redirectTo, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={40} />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated && requireAuth) {
    return null;
  }

  return <>{children}</>;
}
