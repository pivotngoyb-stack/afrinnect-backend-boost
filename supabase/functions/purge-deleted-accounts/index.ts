import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Cron-triggered function that permanently purges accounts
 * past their 30-day grace period. Cleans ALL related data + storage.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find accounts past grace period
    const { data: expiredAccounts, error: fetchError } = await supabase
      .from('deleted_accounts')
      .select('*')
      .eq('status', 'pending_deletion')
      .lte('scheduled_deletion_at', new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!expiredAccounts || expiredAccounts.length === 0) {
      return new Response(JSON.stringify({ message: 'No accounts to purge' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const account of expiredAccounts) {
      const userId = account.user_id;
      try {
        // Get profile id
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id, photos')
          .eq('user_id', userId)
          .maybeSingle();

        const profileId = profile?.id;

        // 1. Delete storage photos
        if (profile?.photos && Array.isArray(profile.photos)) {
          for (const photoUrl of profile.photos) {
            try {
              // Extract path from full URL
              const url = new URL(photoUrl);
              const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)/);
              if (pathMatch) {
                await supabase.storage.from('photos').remove([pathMatch[1]]);
              }
            } catch { /* skip invalid URLs */ }
          }
        }

        // 2. Delete all related data (comprehensive cleanup)
        await Promise.all([
          supabase.from('messages').delete().or(`sender_user_id.eq.${userId},receiver_user_id.eq.${userId}`),
          supabase.from('likes').delete().or(`liker_user_id.eq.${userId},liked_user_id.eq.${userId}`),
          supabase.from('passes').delete().eq('passer_user_id', userId),
          supabase.from('matches').delete().or(`user1_user_id.eq.${userId},user2_user_id.eq.${userId}`),
          supabase.from('notifications').delete().eq('user_id', userId),
          supabase.from('user_ml_profiles').delete().eq('user_id', userId),
          supabase.from('legal_acceptances').delete().eq('user_id', userId),
          supabase.from('user_roles').delete().eq('user_id', userId),
          supabase.from('error_logs').delete().eq('user_id', userId),
          supabase.from('content_moderations').delete().eq('user_id', userId),
          supabase.from('disputes').delete().eq('user_id', userId),
          supabase.from('business_favorites').delete().eq('user_id', userId),
          supabase.from('business_reviews').delete().eq('user_id', userId),
        ]);

        // Profile-linked data
        if (profileId) {
          await Promise.all([
            supabase.from('community_members').delete().eq('user_profile_id', profileId),
            supabase.from('date_feedbacks').delete().eq('user_profile_id', profileId),
            supabase.from('daily_matches').delete().or(`user_profile_id.eq.${profileId},suggested_profile_id.eq.${profileId}`),
            supabase.from('background_checks').delete().eq('user_profile_id', profileId),
            supabase.from('fake_profile_detections').delete().eq('user_profile_id', profileId),
            supabase.from('founder_code_redemptions').delete().eq('user_profile_id', profileId),
            supabase.from('quiz_responses').delete().eq('user_profile_id', profileId),
            supabase.from('success_stories').delete().eq('submitter_profile_id', profileId),
            supabase.from('story_votes').delete().eq('voter_profile_id', profileId),
            supabase.from('reports').delete().or(`reporter_profile_id.eq.${profileId},reported_profile_id.eq.${profileId}`),
            supabase.from('user_stories').delete().eq('user_profile_id', profileId),
            supabase.from('virtual_gifts').delete().or(`sender_profile_id.eq.${profileId},receiver_profile_id.eq.${profileId}`),
            supabase.from('profile_boosts').delete().eq('user_profile_id', profileId),
            supabase.from('user_blocks').delete().or(`blocker_profile_id.eq.${profileId},blocked_profile_id.eq.${profileId}`),
            supabase.from('safety_checks').delete().eq('user_profile_id', profileId),
          ]);
        }

        // 3. Delete profile
        await supabase.from('user_profiles').delete().eq('user_id', userId);

        // 4. Ambassador data
        const { data: ambassador } = await supabase
          .from('ambassadors')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (ambassador) {
          await Promise.all([
            supabase.from('ambassador_commissions').delete().eq('ambassador_id', ambassador.id),
            supabase.from('ambassador_referrals').delete().eq('ambassador_id', ambassador.id),
            supabase.from('ambassador_referral_events').delete().eq('ambassador_id', ambassador.id),
            supabase.from('ambassador_payouts').delete().eq('ambassador_id', ambassador.id),
          ]);
          await supabase.from('ambassadors').delete().eq('user_id', userId);
        }

        // 5. Delete auth user permanently
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteAuthError) {
          console.error(`Failed to delete auth user ${userId}:`, deleteAuthError);
          results.push({ userId, success: false, error: deleteAuthError.message });
          continue;
        }

        // 6. Mark as permanently deleted
        await supabase.from('deleted_accounts').update({
          status: 'permanently_deleted',
          metadata: {
            ...account.metadata,
            permanently_deleted_at: new Date().toISOString(),
          }
        }).eq('id', account.id);

        results.push({ userId, success: true });
      } catch (err) {
        console.error(`Error purging user ${userId}:`, err);
        results.push({ userId, success: false, error: (err as Error).message });
      }
    }

    return new Response(JSON.stringify({ 
      purged: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Purge error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
