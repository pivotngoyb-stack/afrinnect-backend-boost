// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildLoginRedirectTarget } from '@/lib/auth-redirect';
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

  const redirectWithNext = useCallback(() => {
    const next = buildLoginRedirectTarget();
    navigate(`${redirectTo}?next=${encodeURIComponent(next)}`, { replace: true });
  }, [navigate, redirectTo]);

  useEffect(() => {
    let mounted = true;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const checkAuth = async (sessionUser = null) => {
      try {
        if (!requireAuth) {
          if (mounted) setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        const restoredUser = sessionUser ?? session?.user ?? null;

        if (!restoredUser) {
          if (mounted) {
            setAuthenticated(false);
            setLoading(false);
          }
          redirectWithNext();
          return;
        }

        // Validate restored session with the auth server once startup is complete.
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        const activeUserId = user?.id ?? restoredUser.id;

        if (userError?.status === 401 || (!user && !activeUserId)) {
          if (userError?.message?.includes('token') || userError?.status === 401) {
            await supabase.auth.signOut();
          }
          if (mounted) {
            setAuthenticated(false);
            setLoading(false);
          }
          redirectWithNext();
          return;
        }

        if (mounted) setAuthenticated(true);

        if (requireProfile) {
          const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', activeUserId)
            .limit(1);

          if (!mounted) return;

          if (profileError) {
            console.error('Profile check failed:', profileError);
            setLoading(false);
            return;
          }

          if (!profiles || profiles.length === 0) {
            if (mounted) navigate('/onboarding', { replace: true });
            return;
          }
        }

        if (mounted) setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);

        if (!mounted) return;

        const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (session?.user) {
          setAuthenticated(true);
          setLoading(false);
          return;
        }

        setAuthenticated(false);
        setLoading(false);
        redirectWithNext();
      }
    };

    void checkAuth();

    // Safety net: if loading never resolves after 12s, stop loading to avoid blank screen
    safetyTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 12000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setAuthenticated(false);
        setLoading(false);
        redirectWithNext();
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setLoading(true);
        queueMicrotask(() => {
          void checkAuth(session.user);
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (safetyTimer) clearTimeout(safetyTimer);
    };
  }, [requireAuth, requireProfile, redirectWithNext]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Afrinnect</h2>
          <p className="text-muted-foreground text-sm">Getting things ready…</p>
        </div>
      </div>
    );
  }

  if (!authenticated && requireAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
          <p className="text-muted-foreground text-sm">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
