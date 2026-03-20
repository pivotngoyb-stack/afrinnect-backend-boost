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

    // Verify user
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

    const { reason, confirmDelete } = await req.json();

    if (!confirmDelete) {
      return new Response(JSON.stringify({ error: 'Deletion not confirmed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the deletion
    await supabase.from('deleted_accounts').insert({
      user_id: user.id,
      email: user.email,
      reason: reason || 'No reason provided',
      metadata: { deleted_at: new Date().toISOString() }
    });

    // Delete user data in order
    const userId = user.id;
    
    // Get profile id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      const profileId = profile.id;
      // Delete related data
      await Promise.all([
        supabase.from('messages').delete().or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`),
        supabase.from('likes').delete().or(`liker_user_id.eq.${userId},liked_user_id.eq.${userId}`),
        supabase.from('passes').delete().eq('passer_user_id', userId),
        supabase.from('matches').delete().or(`user1_user_id.eq.${userId},user2_user_id.eq.${userId}`),
        supabase.from('notifications').delete().eq('user_id', userId),
        supabase.from('user_ml_profiles').delete().eq('user_id', userId),
        supabase.from('legal_acceptances').delete().eq('user_id', userId),
      ]);
      
      // Delete profile
      await supabase.from('user_profiles').delete().eq('user_id', userId);
    }

    // Delete user roles
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete account. Please contact support.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Account deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
