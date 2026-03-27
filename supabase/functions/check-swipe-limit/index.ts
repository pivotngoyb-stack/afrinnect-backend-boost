import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Server-side swipe limits per tier
const TIER_LIMITS: Record<string, number> = {
  free: 10,
  premium: 50,
  elite: -1,   // unlimited
  vip: -1,     // unlimited
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, profileId } = await req.json();

    // Get profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id,subscription_tier,daily_likes_count,daily_likes_reset_date')
      .eq('id', profileId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tier = profile.subscription_tier || 'free';
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const today = new Date().toISOString().split('T')[0];
    const shouldReset = profile.daily_likes_reset_date !== today;
    const currentCount = shouldReset ? 0 : (profile.daily_likes_count || 0);

    if (action === 'check') {
      const isUnlimited = limit === -1;
      const remaining = isUnlimited ? -1 : Math.max(0, limit - currentCount);
      const resetTime = new Date();
      resetTime.setUTCHours(24, 0, 0, 0);

      return new Response(JSON.stringify({
        allowed: isUnlimited || currentCount < limit,
        remaining,
        limit: isUnlimited ? 'unlimited' : limit,
        resetsAt: resetTime.toISOString(),
        tier,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'increment') {
      // Check limit before incrementing
      if (limit !== -1 && currentCount >= limit) {
        const resetTime = new Date();
        resetTime.setUTCHours(24, 0, 0, 0);
        return new Response(JSON.stringify({
          allowed: false,
          error: 'daily_limit_reached',
          remaining: 0,
          resetsAt: resetTime.toISOString(),
          tier,
        }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Atomically increment
      const newCount = shouldReset ? 1 : currentCount + 1;
      await supabase.from('user_profiles').update({
        daily_likes_count: newCount,
        daily_likes_reset_date: today,
      }).eq('id', profileId);

      const remaining = limit === -1 ? -1 : Math.max(0, limit - newCount);

      return new Response(JSON.stringify({
        allowed: true,
        remaining,
        count: newCount,
        tier,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "check" or "increment".' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Swipe limit error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
