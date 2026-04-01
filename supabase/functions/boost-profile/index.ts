import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const TIER_BOOST_LIMITS: Record<string, { monthly_boosts: number; duration_minutes: number }> = {
  free: { monthly_boosts: 0, duration_minutes: 0 },
  premium: { monthly_boosts: 1, duration_minutes: 30 },
  elite: { monthly_boosts: 5, duration_minutes: 60 },
  vip: { monthly_boosts: -1, duration_minutes: 120 }, // -1 = unlimited
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, subscription_tier, profile_boost_active, boost_expires_at, is_photo_verified, is_id_verified')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verification no longer required for boosts

    // Check active boost
    if (profile.profile_boost_active && profile.boost_expires_at) {
      const expiresAt = new Date(profile.boost_expires_at).getTime()
      if (expiresAt > Date.now()) {
        return new Response(JSON.stringify({ error: 'You already have an active boost.', already_active: true }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const tier = (profile.subscription_tier || 'free') as string
    const tierConfig = TIER_BOOST_LIMITS[tier] || TIER_BOOST_LIMITS.free

    // Free tier cannot boost
    if (tierConfig.monthly_boosts === 0) {
      return new Response(JSON.stringify({ error: 'Upgrade your plan to use boosts.', upgrade_required: true }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check monthly limit (unless unlimited)
    if (tierConfig.monthly_boosts > 0) {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('profile_boosts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())

      if ((count ?? 0) >= tierConfig.monthly_boosts) {
        return new Response(JSON.stringify({
          error: `You've used all ${tierConfig.monthly_boosts} boosts this month.`,
          limit_reached: true,
        }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Activate boost
    const now = new Date()
    const expiresAt = new Date(now.getTime() + tierConfig.duration_minutes * 60 * 1000)

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Insert boost record
    await serviceClient.from('profile_boosts').insert({
      user_id: user.id,
      user_profile_id: profile.id,
      boost_type: 'standard',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    })

    // Update profile
    await serviceClient.from('user_profiles').update({
      profile_boost_active: true,
      boost_expires_at: expiresAt.toISOString(),
    }).eq('id', profile.id)

    return new Response(JSON.stringify({
      success: true,
      duration_minutes: tierConfig.duration_minutes,
      expires_at: expiresAt.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
