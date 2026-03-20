import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that checks if the current user needs photo verification.
 * 
 * Rules:
 * - After 3 matches, if user is NOT photo-verified, they are gated.
 * - Gated users cannot like, swipe, or send messages.
 */
export function useVerificationGate(userProfile: any) {
  const [isGated, setIsGated] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) {
      setLoading(false);
      return;
    }

    // Already verified — never gated
    if (userProfile.is_photo_verified) {
      setIsGated(false);
      setLoading(false);
      return;
    }

    const checkGate = async () => {
      try {
        // Count user's total matches (both sides)
        const [{ count: c1 }, { count: c2 }] = await Promise.all([
          supabase.from('matches').select('*', { count: 'exact', head: true })
            .eq('user1_id', userProfile.id).eq('is_match', true),
          supabase.from('matches').select('*', { count: 'exact', head: true })
            .eq('user2_id', userProfile.id).eq('is_match', true),
        ]);

        const total = (c1 || 0) + (c2 || 0);
        setMatchCount(total);
        setIsGated(total >= 3);
      } catch (e) {
        console.error('Verification gate check failed:', e);
        setIsGated(false);
      } finally {
        setLoading(false);
      }
    };

    checkGate();
  }, [userProfile?.id, userProfile?.is_photo_verified]);

  return { isGated, matchCount, loading };
}
