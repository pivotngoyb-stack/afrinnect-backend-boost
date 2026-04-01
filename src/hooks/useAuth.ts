import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: any | null;
  profile: any | null;
  isAdmin: boolean;
  loading: boolean;
  authenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    loading: true,
    authenticated: false,
  });

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) {
          if (mounted) setState(s => ({ ...s, loading: false }));
          return;
        }

        const [profileRes, roleRes] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', user.id),
        ]);

        if (!mounted) return;

        const roles = (roleRes.data || []).map((r: any) => r.role);

        setState({
          user,
          profile: profileRes.data,
          isAdmin: roles.includes('admin'),
          loading: false,
          authenticated: true,
        });
      } catch {
        if (mounted) setState(s => ({ ...s, loading: false }));
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT' || _event === 'TOKEN_REFRESHED' && !session) {
        if (mounted) setState({ user: null, profile: null, isAdmin: false, loading: false, authenticated: false });
      } else if (session && mounted) {
        loadUser();
      }
    });

    // Session heartbeat: detect stale/revoked tokens (e.g. signed in on another device)
    const heartbeat = setInterval(async () => {
      if (!mounted) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && mounted) {
          setState({ user: null, profile: null, isAdmin: false, loading: false, authenticated: false });
        }
      } catch {
        // Network error — don't sign out, just skip
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(heartbeat);
    };
  }, []);

  return state;
}
