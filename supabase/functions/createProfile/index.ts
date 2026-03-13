import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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

    const { data: existingProfile } = await admin
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'You already have a profile', profile: existingProfile }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      insertData.device_info = {
        id: device_id ?? null,
        name: device_name ?? null,
      };
    }

    const { data: profile, error: createError } = await admin
      .from('user_profiles')
      .insert(insertData)
      .select('*')
      .single();

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
