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

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (!roles?.some(r => r.role === 'admin')) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch founders data
    const [foundersResult, codesResult, redemptionsResult] = await Promise.all([
      supabase.from('user_profiles').select('id, display_name, is_founding_member, founding_member_trial_ends_at, founding_member_converted, created_at').eq('is_founding_member', true).limit(1000),
      supabase.from('founder_invite_codes').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('founder_code_redemptions').select('*').order('created_at', { ascending: false }).limit(500),
    ]);

    const founders = foundersResult.data || [];
    const codes = codesResult.data || [];
    const redemptions = redemptionsResult.data || [];
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const active = founders.filter(f => {
      const end = f.founding_member_trial_ends_at ? new Date(f.founding_member_trial_ends_at) : null;
      return end && end > now;
    });
    const converted = founders.filter(f => f.founding_member_converted);
    const expired = founders.filter(f => {
      const end = f.founding_member_trial_ends_at ? new Date(f.founding_member_trial_ends_at) : null;
      return end && end < now && !f.founding_member_converted;
    });

    const expiringThisWeek = founders.filter(f => {
      const end = f.founding_member_trial_ends_at ? new Date(f.founding_member_trial_ends_at) : null;
      return end && end > now && end < weekFromNow;
    }).map(f => ({
      profile_id: f.id,
      display_name: f.display_name,
      trial_ends_at: f.founding_member_trial_ends_at,
      days_remaining: Math.ceil((new Date(f.founding_member_trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    const inviteCodes = codes.map(c => {
      const codeRedemptions = redemptions.filter(r => r.code_id === c.id);
      return {
        id: c.id,
        code: c.code,
        max: c.max_redemptions,
        redemptions: codeRedemptions.length,
        is_active: c.is_active,
        expires_at: c.expires_at,
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        summary: {
          total: founders.length,
          active: active.length,
          converted: converted.length,
          expired: expired.length,
          conversionRate: founders.length > 0 ? Math.round((converted.length / founders.length) * 100) : 0,
        },
        expiringThisWeek,
        inviteCodes,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Founder stats error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
