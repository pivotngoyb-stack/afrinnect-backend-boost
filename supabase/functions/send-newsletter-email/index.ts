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

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { campaign_title, subject, body, target_audience } = await req.json();

    if (!subject || !body) {
      return new Response(JSON.stringify({ error: 'subject and body are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get target users based on audience
    let query = supabase.from('user_profiles').select('id, user_id, display_name, email');
    
    if (target_audience === 'premium') {
      query = query.in('subscription_tier', ['gold', 'platinum', 'diamond']);
    } else if (target_audience === 'founders') {
      query = query.eq('is_founding_member', true);
    } else if (target_audience === 'free') {
      query = query.or('subscription_tier.is.null,subscription_tier.eq.free');
    }
    // 'all' = no filter

    const { data: users, error: queryError } = await query.limit(1000);
    if (queryError) throw queryError;

    const targeted = users?.length || 0;

    // Create in-app notifications for all targeted users
    if (users && users.length > 0) {
      const notifications = users.map(u => ({
        user_profile_id: u.id,
        user_id: u.user_id,
        type: 'admin_message' as const,
        title: subject,
        message: body.substring(0, 500),
        is_admin: true,
      }));

      // Insert in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        await supabase.from('notifications').insert(batch);
      }
    }

    // Audit log
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      action: 'newsletter_sent',
      target_type: 'campaign',
      target_id: campaign_title || subject,
      details: { subject, target_audience, targeted, sent: targeted },
    });

    return new Response(JSON.stringify({
      success: true,
      targeted,
      sent: targeted,
      message: `Campaign delivered to ${targeted} users as in-app notifications`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
