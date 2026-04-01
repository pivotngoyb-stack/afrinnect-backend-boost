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

    const { profileId, batchAll } = await req.json();

    // If batchAll, recalculate all active profiles (for cron)
    const profileIds: string[] = [];
    if (batchAll) {
      const { data: allProfiles } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('is_active', true)
        .eq('is_banned', false)
        .limit(5000);
      if (allProfiles) profileIds.push(...allProfiles.map((p: any) => p.id));
    } else if (profileId) {
      profileIds.push(profileId);
    } else {
      return new Response(JSON.stringify({ error: 'profileId or batchAll required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    for (const pid of profileIds) {
      try {
        // Fetch profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id,display_name,bio,interests,photos,primary_photo,profession,education,religion,relationship_goal,is_photo_verified,is_id_verified,verification_status,prompts,profile_prompts,voice_intro_url,video_profile_url,opening_move')
          .eq('id', pid)
          .single();

        if (!profile) continue;

        // Calculate profile completeness (0-100)
        let completeness = 0;
        if (profile.display_name) completeness += 10;
        if (profile.bio && profile.bio.length > 20) completeness += 15;
        if (profile.primary_photo) completeness += 15;
        const photoCount = Array.isArray(profile.photos) ? profile.photos.filter(Boolean).length : 0;
        completeness += Math.min(photoCount * 5, 20); // up to 4 extra photos
        if (profile.interests?.length > 0) completeness += 10;
        if (profile.profession) completeness += 5;
        if (profile.education) completeness += 5;
        if (profile.religion) completeness += 3;
        if (profile.relationship_goal) completeness += 5;
        if (profile.voice_intro_url) completeness += 5;
        if (profile.opening_move) completeness += 4;
        const hasPrompts = profile.prompts?.length > 0 || profile.profile_prompts?.length > 0;
        if (hasPrompts) completeness += 3;
        completeness = Math.min(completeness, 100);

        // Fetch engagement metrics in parallel
        const [likesReceivedRes, likesGivenRes, matchesRes, reportsRes, messagesRes] = await Promise.all([
          supabase.from('likes').select('id', { count: 'exact', head: true }).eq('liked_id', pid),
          supabase.from('likes').select('id', { count: 'exact', head: true }).eq('liker_id', pid),
          supabase.from('matches').select('id', { count: 'exact', head: true })
            .eq('is_match', true)
            .or(`user1_id.eq.${pid},user2_id.eq.${pid}`),
          supabase.from('reports').select('id', { count: 'exact', head: true }).eq('reported_id', pid),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', pid),
        ]);

        const likesReceived = likesReceivedRes.count || 0;
        const likesGiven = likesGivenRes.count || 0;
        const matchCount = matchesRes.count || 0;
        const reportCount = reportsRes.count || 0;
        const messagesSent = messagesRes.count || 0;

        // Swipe-right rate: likes received / total swipes on this profile (approximated)
        const totalExposures = likesReceived + (likesGiven > 0 ? likesGiven : 1); // rough proxy
        const swipeRightRate = Math.min(likesReceived / Math.max(totalExposures, 1), 1);

        // Response rate: messages sent / matches
        const responseRate = matchCount > 0 ? Math.min(messagesSent / (matchCount * 3), 1) : 0;

        // Verification bonus
        let verificationBonus = 0;
        if (profile.is_photo_verified || profile.verification_status === 'verified') verificationBonus += 10;
        if (profile.is_id_verified) verificationBonus += 10;

        // Calculate heat score (0-100)
        let heatScore = 0;
        heatScore += completeness * 0.25;           // 25 points max from completeness
        heatScore += swipeRightRate * 30;            // 30 points max from desirability
        heatScore += responseRate * 15;              // 15 points max from responsiveness
        heatScore += verificationBonus;              // 20 points max from verification
        heatScore -= Math.min(reportCount * 5, 20);  // -20 max penalty from reports
        heatScore = Math.max(0, Math.min(100, heatScore));

        // Update heat score on profile
        await supabase.from('user_profiles').update({ heat_score: heatScore }).eq('id', pid);

        results.push({ profileId: pid, heatScore: Math.round(heatScore * 10) / 10, completeness });
      } catch (e) {
        console.error(`Heat score calc failed for ${pid}:`, e);
        results.push({ profileId: pid, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, updated: results.length, results: results.slice(0, 20) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Heat score update error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
