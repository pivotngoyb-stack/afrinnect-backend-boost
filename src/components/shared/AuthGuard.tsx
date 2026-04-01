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
    let mounted = true;

    const checkAuth = async () => {
      try {
        if (!requireAuth) {
          if (mounted) setLoading(false);
          return;
        }

        // Use getUser() for server-validated auth (not getSession which trusts local JWT)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // Token expired or invalid — clear stale session and redirect
          if (userError?.message?.includes('token') || userError?.status === 401) {
            await supabase.auth.signOut();
          }
          if (mounted) navigate(redirectTo + '?next=' + encodeURIComponent(window.location.pathname));
          return;
        }

        if (mounted) setAuthenticated(true);

        if (requireProfile) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (!profiles || profiles.length === 0) {
            if (mounted) navigate('/onboarding');
            return;
          }
        }

        if (mounted) setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          // On any auth failure, sign out to prevent stale token loops
          try { await supabase.auth.signOut(); } catch {}
          navigate(redirectTo);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes (session restore, token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setAuthenticated(false);
        navigate(redirectTo);
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        if (session?.user) {
          setAuthenticated(true);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
