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
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, payload } = await req.json();

    switch (action) {
      case 'record_interaction': {
        const { userId, targetProfileId, actionType, metadata } = payload;
        
        // Get or create ML profile
        let { data: mlProfile } = await supabase
          .from('user_ml_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mlProfile) {
          const { data: newProfile } = await supabase
            .from('user_ml_profiles')
            .insert({ user_id: user.id, interaction_history: [], preferences: {}, compatibility_weights: {} })
            .select()
            .single();
          mlProfile = newProfile;
        }

        // Append interaction
        const history = Array.isArray(mlProfile.interaction_history) ? mlProfile.interaction_history : [];
        history.push({
          target_profile_id: targetProfileId,
          action_type: actionType,
          metadata,
          timestamp: new Date().toISOString(),
        });

        // Keep last 500 interactions
        const trimmedHistory = history.slice(-500);

        // Update weights based on feedback
        const weights = mlProfile.compatibility_weights || {};
        if (metadata?.reasons) {
          for (const reason of metadata.reasons) {
            weights[reason] = (weights[reason] || 0) + (actionType === 'like' ? 1 : -1);
          }
        }

        await supabase
          .from('user_ml_profiles')
          .update({
            interaction_history: trimmedHistory,
            compatibility_weights: weights,
            last_calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_suggestions': {
        const { data: mlProfile } = await supabase
          .from('user_ml_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        return new Response(JSON.stringify({
          success: true,
          weights: mlProfile?.compatibility_weights || {},
          preferences: mlProfile?.preferences || {},
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('ML matching engine error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
