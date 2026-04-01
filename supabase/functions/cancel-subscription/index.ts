import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const anonClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subscription_id, reason, feedback } = await req.json();

    // Get user's profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find active subscription
    let query = supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active');
    if (subscription_id) {
      query = query.eq('id', subscription_id);
    }
    const { data: subscription } = await query.maybeSingle();

    if (!subscription) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cancel subscription - keep active until end_date
    await supabase.from('subscriptions').update({
      status: 'cancelled',
      auto_renew: false,
      updated_at: new Date().toISOString(),
    }).eq('id', subscription.id);

    // Create notification
    await supabase.from('notifications').insert({
      user_profile_id: profile.id,
      user_id: user.id,
      type: 'admin_message',
      title: 'Subscription Cancelled',
      message: `Your subscription will remain active until ${new Date(subscription.end_date).toLocaleDateString()}. We're sad to see you go!`,
      is_admin: true,
    });

    // Structured log (user action, not admin action)
    console.log(JSON.stringify({ action: 'subscription_cancelled', user_id: user.id, subscription_id: subscription.id, plan: subscription.plan_type, reason }));

    return new Response(JSON.stringify({
      success: true,
      message: 'Subscription cancelled successfully',
      active_until: subscription.end_date,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
