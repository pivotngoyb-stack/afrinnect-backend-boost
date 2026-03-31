import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = req.headers.get('x-correlation-id') || `srv-${Date.now().toString(36)}`;
  const log = (action: string, meta?: Record<string, any>) => 
    console.log(JSON.stringify({ correlation_id: correlationId, fn: 'like-profile', action, ts: new Date().toISOString(), ...meta }));

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { action, targetProfileId, isSuperLike = false, likeNote = null } = body;

    if (!action || !targetProfileId) {
      return new Response(JSON.stringify({ error: 'action and targetProfileId are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get the liker's profile
    const { data: myProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id,user_id,display_name,primary_photo,subscription_tier,is_banned,daily_likes_count,daily_likes_reset_date,has_matched_before,blocked_users')
      .eq('user_id', user.id)
      .single();

    if (profileError || !myProfile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (myProfile.is_banned) {
      return new Response(JSON.stringify({ error: 'Account is banned' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Can't like yourself
    if (myProfile.id === targetProfileId) {
      return new Response(JSON.stringify({ error: 'Cannot like yourself' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check blocked
    const blockedUsers: string[] = myProfile.blocked_users || [];
    if (blockedUsers.includes(targetProfileId)) {
      return new Response(JSON.stringify({ error: 'User is blocked' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get target profile
    const { data: targetProfile, error: targetError } = await supabase
      .from('user_profiles')
      .select('id,user_id,display_name,primary_photo,subscription_tier,blocked_users')
      .eq('id', targetProfileId)
      .single();

    if (targetError || !targetProfile) {
      return new Response(JSON.stringify({ error: 'Target profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if target blocked us
    const targetBlocked: string[] = targetProfile.blocked_users || [];
    if (targetBlocked.includes(myProfile.id)) {
      return new Response(JSON.stringify({ error: 'Cannot interact with this user' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === PASS ACTION ===
    if (action === 'pass') {
      log('pass', { liker: myProfile.id, target: targetProfileId });
      await supabase.from('passes').upsert({
        passer_id: myProfile.id,
        passed_id: targetProfileId,
        passer_user_id: myProfile.user_id,
        is_rewindable: true
      }, { onConflict: 'passer_id,passed_id' });

      return new Response(JSON.stringify({ success: true, action: 'pass' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === LIKE ACTION ===
    if (action === 'like') {
      log('like_start', { liker: myProfile.id, target: targetProfileId, is_super: isSuperLike });
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', myProfile.id)
        .eq('liked_id', targetProfileId)
        .maybeSingle();

      if (existingLike) {
        // Already liked - check for mutual match anyway
        const { data: mutualLike } = await supabase
          .from('likes')
          .select('id')
          .eq('liker_id', targetProfileId)
          .eq('liked_id', myProfile.id)
          .maybeSingle();

        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${myProfile.id},user2_id.eq.${targetProfileId}),and(user1_id.eq.${targetProfileId},user2_id.eq.${myProfile.id})`)
          .maybeSingle();

        return new Response(JSON.stringify({
          success: true,
          action: 'like',
          alreadyLiked: true,
          isMatch: !!mutualLike && !!existingMatch,
          matchId: existingMatch?.id || null
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Enforce daily like limits
      const tier = myProfile.subscription_tier || 'free';
      const tierLimits: Record<string, number> = { free: 10, premium: 50, elite: -1, vip: -1 };
      const limit = tierLimits[tier] ?? 10;

    if (limit > 0) {
        const today = new Date().toISOString().split('T')[0];
        const currentCount = myProfile.daily_likes_reset_date === today ? (myProfile.daily_likes_count || 0) : 0;

        if (currentCount >= limit) {
          return new Response(JSON.stringify({ error: 'daily_limit_reached', limit, count: currentCount }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Atomic increment to prevent race conditions on two devices
        // Reset count if it's a new day, otherwise increment
        const newCount = myProfile.daily_likes_reset_date === today ? currentCount + 1 : 1;
        const { error: updateError } = await supabase.from('user_profiles').update({
          daily_likes_count: newCount,
          daily_likes_reset_date: today
        }).eq('id', myProfile.id)
          .eq('daily_likes_count', myProfile.daily_likes_count || 0); // Optimistic lock

        if (updateError) {
          // Concurrent update — re-read and check
          const { data: freshProfile } = await supabase.from('user_profiles')
            .select('daily_likes_count,daily_likes_reset_date')
            .eq('id', myProfile.id).single();
          const freshCount = freshProfile?.daily_likes_reset_date === today ? (freshProfile?.daily_likes_count || 0) : 0;
          if (freshCount >= limit) {
            return new Response(JSON.stringify({ error: 'daily_limit_reached', limit, count: freshCount }), {
              status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          // Retry increment
          await supabase.from('user_profiles').update({
            daily_likes_count: freshCount + 1,
            daily_likes_reset_date: today
          }).eq('id', myProfile.id);
        }
      }

      // Create the like
      const isPriorityLike = tier === 'elite' || tier === 'vip';
      await supabase.from('likes').insert({
        liker_id: myProfile.id,
        liked_id: targetProfileId,
        liker_user_id: myProfile.user_id,
        liked_user_id: targetProfile.user_id,
        is_super_like: isSuperLike,
        is_seen: false,
        is_priority: isPriorityLike,
        priority_boost_expires: isPriorityLike ? new Date(Date.now() + 86400000).toISOString() : null
      });

      // Check for mutual like → atomic match creation
      const { data: mutualLike } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', targetProfileId)
        .eq('liked_id', myProfile.id)
        .maybeSingle();

      let isMatch = false;
      let matchId: string | null = null;

      if (mutualLike) {
        // Check existing match first (idempotency)
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${myProfile.id},user2_id.eq.${targetProfileId}),and(user1_id.eq.${targetProfileId},user2_id.eq.${myProfile.id})`)
          .maybeSingle();

        if (existingMatch) {
          isMatch = true;
          matchId = existingMatch.id;
        } else {
          log('match_create', { user1: myProfile.id, user2: targetProfileId });
          const { data: newMatch, error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: myProfile.id,
              user2_id: targetProfileId,
              user1_user_id: myProfile.user_id,
              user2_user_id: targetProfile.user_id,
              user1_liked: true,
              user2_liked: true,
              is_match: true,
              matched_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              is_expired: false,
              last_chance_sent: false,
              first_message_sent: false,
              status: 'active'
            })
            .select('id')
            .single();

          if (matchError) {
            log('match_create_conflict', { code: matchError.code, user1: myProfile.id, user2: targetProfileId });
            if (matchError.code === '23505') {
              const { data: raceMatch } = await supabase
                .from('matches')
                .select('id')
                .or(`and(user1_id.eq.${myProfile.id},user2_id.eq.${targetProfileId}),and(user1_id.eq.${targetProfileId},user2_id.eq.${myProfile.id})`)
                .maybeSingle();
              matchId = raceMatch?.id || null;
            }
          } else {
            matchId = newMatch?.id || null;
          }

          isMatch = true;

          // Update first-match flag
          if (!myProfile.has_matched_before) {
            await supabase.from('user_profiles').update({ has_matched_before: true }).eq('id', myProfile.id);
          }

          // Fire-and-forget notifications
          Promise.all([
            supabase.rpc('create_notification', {
              p_user_profile_id: targetProfileId,
              p_user_id: targetProfile.user_id,
              p_type: 'match',
              p_title: "It's a Match! 💕",
              p_message: `You and ${myProfile.display_name} liked each other!`,
              p_from_profile_id: myProfile.id,
              p_link_to: '/matches'
            }),
            supabase.rpc('create_notification', {
              p_user_profile_id: myProfile.id,
              p_user_id: myProfile.user_id,
              p_type: 'match',
              p_title: "It's a Match! 💕",
              p_message: `You and ${targetProfile.display_name} liked each other!`,
              p_from_profile_id: targetProfileId,
              p_link_to: '/matches'
            }),
          ]).catch(e => console.warn('Match notifications failed:', e));
        }
      } else if (!existingLike) {
        // Send like notification (fire-and-forget)
        supabase.rpc('create_notification', {
          p_user_profile_id: targetProfileId,
          p_user_id: targetProfile.user_id,
          p_type: isSuperLike ? 'super_like' : 'like',
          p_title: isSuperLike ? "You got a Super Like! ⭐" : "Someone likes you!",
          p_message: `${myProfile.display_name} ${isSuperLike ? 'super liked' : 'liked'} your profile`,
          p_from_profile_id: myProfile.id,
          p_link_to: '/matches'
        }).catch(e => console.warn('Like notification failed:', e));
      }

      // If there's a like note and a match exists, send as first message
      if (likeNote && matchId) {
        await supabase.from('messages').insert({
          match_id: matchId,
          sender_id: myProfile.id,
          receiver_id: targetProfileId,
          sender_user_id: myProfile.user_id,
          receiver_user_id: targetProfile.user_id,
          content: likeNote,
          message_type: 'text',
          like_note: likeNote
        });
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'like',
        isMatch,
        matchId,
        alreadyLiked: false,
        isSuperLike
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === REWIND ACTION ===
    if (action === 'rewind') {
      // Delete both like and pass records for this target atomically
      await Promise.all([
        supabase.from('likes').delete().eq('liker_id', myProfile.id).eq('liked_id', targetProfileId),
        supabase.from('passes').delete().eq('passer_id', myProfile.id).eq('passed_id', targetProfileId),
      ]);

      return new Response(JSON.stringify({ success: true, action: 'rewind' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "like", "pass", or "rewind".' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('like-profile error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
