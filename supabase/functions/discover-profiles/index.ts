import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user's JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const {
      profileId,
      discoveryMode = 'local', // 'local' | 'global'
      currentCity = null,
      currentCountry = null,
      filters = {},
      excludeIds = [],
      limit = 50,
    } = body;

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), { status: 400, headers: corsHeaders });
    }

    // Get the user's blocked list, existing likes, passes, and matches in parallel
    const [blockedRes, likesRes, passesRes, matchesRes] = await Promise.all([
      supabase.from('user_profiles').select('blocked_users').eq('id', profileId).single(),
      supabase.from('likes').select('liked_id').eq('liker_id', profileId),
      supabase.from('passes').select('passed_id').eq('passer_id', profileId),
      // Direct query instead of missing RPC
      supabase.from('matches')
        .select('user1_id,user2_id')
        .eq('is_match', true)
        .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`),
    ]);

    const blockedUsers: string[] = blockedRes.data?.blocked_users || [];
    const likedIds: string[] = (likesRes.data || []).map((l: any) => l.liked_id);
    const passedIds: string[] = (passesRes.data || []).map((p: any) => p.passed_id);
    const matchedIds: string[] = (matchesRes.data || []).map((m: any) =>
      m.user1_id === profileId ? m.user2_id : m.user1_id
    );

    // Build exclusion set — includes passes so swiped-left profiles don't reappear
    const excludeSet = new Set([profileId, ...blockedUsers, ...likedIds, ...passedIds, ...matchedIds, ...excludeIds]);

    // Get requester's tier for incognito filtering
    const requesterProfile = blockedRes.data;
    const requesterTier = requesterProfile?.subscription_tier || 'free';

    // Build query — order by heat_score for quality-based discovery
    // VIP/Elite profiles with priority_ranking enabled get boosted via heat_score
    let query = supabase
      .from('user_profiles')
      .select('id,user_id,display_name,primary_photo,photos,birth_date,gender,current_city,current_country,country_of_origin,bio,interests,subscription_tier,is_photo_verified,is_id_verified,verification_status,last_active,heat_score,opening_move,profile_prompts,incognito_mode,profile_boost_active,boost_expires_at')
      .eq('is_active', true)
      .eq('is_banned', false)
      .not('id', 'in', `(${Array.from(excludeSet).join(',')})`)
      .not('birth_date', 'is', null)
      .lte('birth_date', (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })())
      .order('heat_score', { ascending: false, nullsFirst: false })
      .order('last_active', { ascending: false })
      .limit(Math.min(limit, 100));

    // Location filtering
    if (discoveryMode === 'local' && currentCity) {
      query = query.eq('current_city', currentCity);
    } else if (discoveryMode === 'local' && currentCountry) {
      query = query.eq('current_country', currentCountry);
    }

    // Apply filters
    if (filters.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters.minAge) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - filters.minAge);
      query = query.lte('birth_date', maxBirthDate.toISOString().split('T')[0]);
    }
    if (filters.maxAge) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - filters.maxAge - 1);
      query = query.gte('birth_date', minBirthDate.toISOString().split('T')[0]);
    }
    if (filters.country) {
      query = query.eq('current_country', filters.country);
    }
    if (filters.verified) {
      query = query.or('verification_status.eq.verified,is_photo_verified.eq.true,is_id_verified.eq.true');
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Discovery query error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), { status: 500, headers: corsHeaders });
    }

    // If local returned too few, fall back to country/global
    let finalProfiles = profiles || [];
    if (discoveryMode === 'local' && finalProfiles.length < 5 && currentCountry) {
      const { data: countryProfiles } = await supabase
        .from('user_profiles')
        .select('id,user_id,display_name,primary_photo,photos,birth_date,gender,current_city,current_country,country_of_origin,bio,interests,subscription_tier,is_photo_verified,is_id_verified,verification_status,last_active')
        .eq('is_active', true)
        .eq('is_banned', false)
        .eq('current_country', currentCountry)
        .not('id', 'in', `(${Array.from(excludeSet).join(',')})`)
        .not('birth_date', 'is', null)
        .lte('birth_date', (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d.toISOString().split('T')[0]; })())
        .order('last_active', { ascending: false })
        .limit(Math.min(limit, 100));

      // Merge without duplicates
      const existingIds = new Set(finalProfiles.map((p: any) => p.id));
      (countryProfiles || []).forEach((p: any) => {
        if (!existingIds.has(p.id)) finalProfiles.push(p);
      });
    }

    // Filter out incognito profiles (they should only be visible to people they liked)
    finalProfiles = finalProfiles.filter((p: any) => {
      if (!p.incognito_mode) return true;
      // Incognito users are hidden from discovery — they only appear if they liked you
      return likedIds.includes(p.id) === false && (likesRes.data || []).some?.(() => false);
    });
    // Actually: incognito profiles should be fully hidden from discovery
    finalProfiles = finalProfiles.filter((p: any) => !p.incognito_mode);

    // Sort: boosted profiles first, then VIP featured profiles, then by heat_score
    const now = Date.now();
    finalProfiles.sort((a: any, b: any) => {
      // Active boosts first
      const aBoost = a.profile_boost_active && a.boost_expires_at && new Date(a.boost_expires_at).getTime() > now ? 1 : 0;
      const bBoost = b.profile_boost_active && b.boost_expires_at && new Date(b.boost_expires_at).getTime() > now ? 1 : 0;
      if (bBoost !== aBoost) return bBoost - aBoost;

      // VIP featured profiles second
      const tierOrder: Record<string, number> = { vip: 3, elite: 2, premium: 1, free: 0 };
      const aTier = tierOrder[a.subscription_tier || 'free'] || 0;
      const bTier = tierOrder[b.subscription_tier || 'free'] || 0;
      if (bTier !== aTier) return bTier - aTier;

      // Then by heat_score (already sorted by DB but re-confirm after merge)
      return (b.heat_score || 0) - (a.heat_score || 0);
    });

    finalProfiles = finalProfiles.map((p: any) => ({
      ...p,
      is_verified: p.verification_status === 'verified' || p.is_photo_verified || p.is_id_verified,
      heat_score: undefined, // strip internal score from client response
      incognito_mode: undefined,
      profile_boost_active: undefined,
      boost_expires_at: undefined,
    }));

    return new Response(JSON.stringify({ profiles: finalProfiles, count: finalProfiles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Discovery function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
