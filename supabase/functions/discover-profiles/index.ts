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

    // Get the user's blocked list, existing likes, and matches in parallel
    const [blockedRes, likesRes, matchesRes] = await Promise.all([
      supabase.from('user_profiles').select('blocked_users').eq('id', profileId).single(),
      supabase.from('likes').select('liked_id').eq('liker_id', profileId),
      supabase.rpc('get_matched_partner_ids', { p_profile_id: profileId }).catch(() => ({ data: [] })),
    ]);

    const blockedUsers: string[] = blockedRes.data?.blocked_users || [];
    const likedIds: string[] = (likesRes.data || []).map((l: any) => l.liked_id);
    const matchedIds: string[] = (matchesRes.data || []).map((m: any) => m.partner_id || m);

    // Build exclusion set
    const excludeSet = new Set([profileId, ...blockedUsers, ...likedIds, ...matchedIds, ...excludeIds]);

    // Build query
    let query = supabase
      .from('user_profiles')
      .select('id,user_id,display_name,primary_photo,photos,birth_date,gender,current_city,current_country,country_of_origin,bio,interests,subscription_tier,is_photo_verified,is_id_verified,verification_status,last_active')
      .eq('is_active', true)
      .not('id', 'in', `(${Array.from(excludeSet).join(',')})`)
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
        .eq('current_country', currentCountry)
        .not('id', 'in', `(${Array.from(excludeSet).join(',')})`)
        .order('last_active', { ascending: false })
        .limit(Math.min(limit, 100));

      // Merge without duplicates
      const existingIds = new Set(finalProfiles.map((p: any) => p.id));
      (countryProfiles || []).forEach((p: any) => {
        if (!existingIds.has(p.id)) finalProfiles.push(p);
      });
    }

    finalProfiles = finalProfiles.map((p: any) => ({
      ...p,
      is_verified: p.verification_status === 'verified' || p.is_photo_verified || p.is_id_verified,
    }));

    return new Response(JSON.stringify({ profiles: finalProfiles, count: finalProfiles.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Discovery function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
