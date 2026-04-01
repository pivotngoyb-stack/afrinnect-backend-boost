import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

const REWARD_LADDER = [
  { day: 1, type: 'likes', value: 5, title: 'Welcome Boost' },
  { day: 2, type: 'visibility', value: 10, title: 'Visibility Boost' },
  { day: 3, type: 'boost', value: 1, title: 'Free Boost' },
  { day: 4, type: 'super_like', value: 5, title: 'Super Likes' },
  { day: 5, type: 'highlight', value: 1, title: 'Profile Highlight' },
  { day: 6, type: 'priority', value: 1, title: 'Priority Discovery' },
  { day: 7, type: 'streak_badge', value: 1, title: 'Streak Champion' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, login_streak, super_likes_count')
      .eq('user_id', user.id)
      .single();

    if (!profile) return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const today = new Date().toISOString().split('T')[0];
    const streak = Math.max(profile.login_streak || 0, 1);
    const dayIndex = (streak - 1) % 7;
    const reward = REWARD_LADDER[dayIndex];

    // Check if already claimed today (atomic via unique constraint)
    const { error: insertError } = await supabase
      .from('daily_rewards')
      .insert({
        user_profile_id: profile.id,
        user_id: user.id,
        reward_day: reward.day,
        reward_type: reward.type,
        reward_value: reward.value,
        streak_count: streak,
        claim_date: today,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Already claimed today' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw insertError;
    }

    // Actually grant the reward
    const updates: Record<string, any> = {};
    if (reward.type === 'super_like') {
      updates.super_likes_count = (profile.super_likes_count || 0) + reward.value;
    }
    if (reward.type === 'boost') {
      // Grant boost via subscriptions table
      await supabase
        .from('subscriptions')
        .update({ boosts_remaining: 1 })
        .eq('user_profile_id', profile.id)
        .gte('end_date', new Date().toISOString());
    }
    if (reward.type === 'highlight') {
      updates.is_boosted = true;
      updates.boost_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('user_profiles').update(updates).eq('id', profile.id);
    }

    return new Response(JSON.stringify({
      success: true,
      reward: { ...reward, streak },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('claim-daily-reward error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
