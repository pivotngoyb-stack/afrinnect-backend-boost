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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate user token explicitly
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser(token);

    if (userError || !user) {
      console.error('JWT validation error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const payload = await req.json();

    const {
      display_name,
      birth_date,
      gender,
      looking_for,
      photos,
      country_of_origin,
      current_country,
      current_city,
      current_state,
      relationship_goal,
      interests,
      location,
      primary_photo,
      device_id,
      device_name,
    } = payload ?? {};

    if (!display_name || !gender || !current_country) {
      return new Response(
        JSON.stringify({ error: 'Missing required profile fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotent create: if profile exists, return it (or repair incomplete one)
    const { data: existingProfile } = await admin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingProfile) {
      const hasPhotos = Array.isArray(existingProfile.photos) && existingProfile.photos.length > 0;

      if (hasPhotos) {
        return new Response(
          JSON.stringify({ profile: existingProfile, already_exists: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      display_name,
      gender,
      current_country,
      is_active: true,
      last_active: new Date().toISOString(),
      last_login_date: new Date().toISOString(),
    };

    if (birth_date) insertData.birth_date = birth_date;
    if (Array.isArray(looking_for)) insertData.looking_for = looking_for;
    if (Array.isArray(photos)) insertData.photos = photos;
    if (country_of_origin) insertData.country_of_origin = country_of_origin;
    if (current_city) insertData.current_city = current_city;
    if (current_state) insertData.current_state = current_state;
    if (relationship_goal) insertData.relationship_goal = relationship_goal;
    if (Array.isArray(interests)) insertData.interests = interests;
    if (location) insertData.location = location;
    if (primary_photo) insertData.primary_photo = primary_photo;
    if (device_id) insertData.device_ids = [device_id];
    if (device_id || device_name) {
      insertData.device_info = { id: device_id ?? null, name: device_name ?? null };
    }

    let profile: any = null;
    let createError: any = null;

    if (existingProfile) {
      const updateResult = await admin
        .from('user_profiles')
        .update(insertData)
        .eq('id', existingProfile.id)
        .select('*')
        .single();
      profile = updateResult.data;
      createError = updateResult.error;
    } else {
      const insertResult = await admin
        .from('user_profiles')
        .insert(insertData)
        .select('*')
        .single();
      profile = insertResult.data;
      createError = insertResult.error;
    }

    if (createError) {
      console.error('Profile creation error:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-assign founding member status if enabled
    if (profile && !existingProfile) {
      try {
        const { data: founderSettings } = await admin
          .from('system_settings')
          .select('value')
          .eq('key', 'founder_program')
          .maybeSingle();

        const config = founderSettings?.value;
        if (config?.founders_mode_enabled && config?.auto_assign_new_users) {
          const trialDays = config.trial_days || 183;
          const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

          const { error: founderError } = await admin
            .from('user_profiles')
            .update({
              is_founding_member: true,
              founding_member_granted_at: new Date().toISOString(),
              founding_member_trial_ends_at: trialEndsAt,
              founding_member_source: 'auto_signup',
              is_premium: true,
              subscription_tier: 'premium',
              premium_until: trialEndsAt.split('T')[0],
              badges: ['founding_member'],
            })
            .eq('id', profile.id);

          if (founderError) {
            console.error('Founder auto-assign error:', founderError);
          } else {
            console.log(`Auto-assigned founding member to ${profile.id}`);
            // Re-fetch profile with updated fields
            const { data: updated } = await admin
              .from('user_profiles')
              .select('*')
              .eq('id', profile.id)
              .single();
            if (updated) profile = updated;
          }
        }
      } catch (e) {
        console.error('Founder check error:', e);
      }
    }

    return new Response(
      JSON.stringify({ profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('createProfile error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
