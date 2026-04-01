import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GRACE_PERIOD_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user
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

    const { reason, confirmDelete, action, pauseInstead } = await req.json();
    const userId = user.id;

    // === REACTIVATE account ===
    if (action === 'reactivate') {
      const { error: reactivateError } = await supabase
        .from('deleted_accounts')
        .update({ status: 'reactivated', reactivated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'pending_deletion');

      if (reactivateError) {
        return new Response(JSON.stringify({ error: 'Failed to reactivate account' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Unhide profile
      await supabase.from('user_profiles').update({ is_active: true }).eq('user_id', userId);

      return new Response(JSON.stringify({ success: true, message: 'Account reactivated!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === PAUSE account (like Tinder) ===
    if (pauseInstead) {
      await supabase.from('user_profiles').update({ is_active: false }).eq('user_id', userId);
      return new Response(JSON.stringify({ success: true, message: 'Account paused. You won\'t appear in discovery but can return anytime.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === DELETE account ===
    if (!confirmDelete) {
      return new Response(JSON.stringify({ error: 'Deletion not confirmed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profile data for snapshot
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + GRACE_PERIOD_DAYS);

    // Save deletion record with grace period
    await supabase.from('deleted_accounts').insert({
      user_id: userId,
      email: user.email,
      reason: reason || 'No reason provided',
      status: 'pending_deletion',
      scheduled_deletion_at: scheduledAt.toISOString(),
      profile_snapshot: profile ? {
        display_name: profile.display_name,
        photos: profile.photos,
        subscription_tier: profile.subscription_tier,
        created_at: profile.created_at,
        country: profile.current_country,
      } : null,
      metadata: { 
        deleted_at: new Date().toISOString(),
        grace_period_days: GRACE_PERIOD_DAYS,
        user_agent: req.headers.get('user-agent'),
      }
    });

    // Cancel auto-renew on active subscriptions immediately
    if (profile) {
      await supabase.from('subscriptions').update({ 
        auto_renew: false,
        status: 'cancelled',
      }).eq('user_profile_id', profile.id).eq('status', 'active');
    }

    // Hide profile immediately (soft-delete)
    if (profile) {
      await supabase.from('user_profiles').update({ 
        is_active: false,
        bio: '[Account scheduled for deletion]',
      }).eq('user_id', userId);
    }

    // Sign user out
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Your account has been scheduled for deletion. You have ${GRACE_PERIOD_DAYS} days to change your mind by logging back in.`,
      scheduled_deletion_at: scheduledAt.toISOString(),
      grace_period_days: GRACE_PERIOD_DAYS,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
