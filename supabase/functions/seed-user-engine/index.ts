import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Personality configs ──
const PERSONALITIES: Record<string, {
  likeChance: number;
  matchDelay: [number, number]; // min/max minutes
  matchSkipChance: number;
  replyChance: number;
  replyDelay: [number, number];
  maxInteractions: number;
  messageStyle: string;
}> = {
  playful: {
    likeChance: 0.6,
    matchDelay: [1, 5],
    matchSkipChance: 0.1,
    replyChance: 0.85,
    replyDelay: [1, 5],
    maxInteractions: 12,
    messageStyle: "playful, uses emojis, flirty, fun",
  },
  serious: {
    likeChance: 0.35,
    matchDelay: [5, 15],
    matchSkipChance: 0.25,
    replyChance: 0.7,
    replyDelay: [5, 15],
    maxInteractions: 8,
    messageStyle: "thoughtful, asks deep questions, no excessive emojis",
  },
  shy: {
    likeChance: 0.25,
    matchDelay: [10, 30],
    matchSkipChance: 0.35,
    replyChance: 0.5,
    replyDelay: [10, 30],
    maxInteractions: 5,
    messageStyle: "short responses, hesitant, gentle, uses few words",
  },
  outgoing: {
    likeChance: 0.7,
    matchDelay: [1, 3],
    matchSkipChance: 0.05,
    replyChance: 0.9,
    replyDelay: [1, 3],
    maxInteractions: 15,
    messageStyle: "enthusiastic, asks questions, uses slang and emojis liberally",
  },
};

const PERSONALITY_TYPES = Object.keys(PERSONALITIES);

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getPersonality(seed: any) {
  return PERSONALITIES[seed.seed_personality] || PERSONALITIES.playful;
}

// ── Compatibility scoring (simple) ──
function compatibilityScore(seed: any, user: any): number {
  let score = 0;

  // Age proximity (within 5 years = good)
  if (seed.birth_date && user.birth_date) {
    const seedAge = new Date().getFullYear() - new Date(seed.birth_date).getFullYear();
    const userAge = new Date().getFullYear() - new Date(user.birth_date).getFullYear();
    const ageDiff = Math.abs(seedAge - userAge);
    if (ageDiff <= 3) score += 30;
    else if (ageDiff <= 7) score += 15;
    else if (ageDiff <= 12) score += 5;
  }

  // Shared interests
  const seedInterests = new Set((seed.interests || []).map((i: string) => i.toLowerCase()));
  const userInterests = (user.interests || []).map((i: string) => i.toLowerCase());
  const shared = userInterests.filter((i: string) => seedInterests.has(i)).length;
  score += Math.min(shared * 10, 40);

  // Same country/city
  if (seed.current_country && seed.current_country === user.current_country) score += 15;
  if (seed.current_city && seed.current_city === user.current_city) score += 15;

  return Math.min(score, 100);
}

// ── Fallback message templates by personality ──
const MESSAGE_TEMPLATES: Record<string, string[]> = {
  playful: [
    "Hey 😊 love your vibe! Where are you from originally?",
    "Your profile caught my eye 👀 what's the best trip you've taken?",
    "I see you like {interest}! Me too 🎉 tell me more!",
    "Heyy ✨ so what do you do for fun around here?",
    "Okay your photos are 🔥! What's the story behind the first one?",
  ],
  serious: [
    "Hi, nice to match with you. What are you looking for on here?",
    "Hello! I noticed we share an interest in {interest}. What drew you to it?",
    "Hi there. What's something you're passionate about right now?",
    "Nice to meet you. I'd love to hear about your background.",
    "What values matter most to you in a relationship?",
  ],
  shy: [
    "Hey 👋",
    "Hi! Nice to match 😊",
    "Hello... your profile seems really cool",
    "Hey, how's your day going?",
    "Hi 🙂 nice pics!",
  ],
  outgoing: [
    "YOOO we matched!! 🎉🎉 Tell me everything about yourself lol",
    "Hey hey!! I saw you like {interest} — that's awesome! Who's your fave?",
    "Okay I'm SO excited we matched 😆 where do I even start?!",
    "What's up!! Your energy looks amazing from your profile 💫",
    "Hiii!! Okay real talk — what's the best meal you've ever had? 🍲",
  ],
};

const REPLY_TEMPLATES: Record<string, string[]> = {
  playful: [
    "Haha that's so cool! 😂 Tell me more!",
    "No way! I love that 🙌",
    "Aww that's sweet! What else should I know about you? 😏",
    "Okay you're definitely interesting 👀✨",
  ],
  serious: [
    "That's really interesting. I appreciate you sharing that.",
    "I can relate to that. What else matters to you?",
    "That's a thoughtful perspective. I value that.",
    "I'd love to explore that topic more with you.",
  ],
  shy: [
    "Oh nice 🙂",
    "That sounds cool",
    "Haha yeah I get that",
    "Oh really? That's interesting",
  ],
  outgoing: [
    "OMG YES!! I totally agree!! 🔥🔥",
    "Hahaha okay I love this energy!! Tell me MORE",
    "No wayyyy 😱 that's amazing!!",
    "Okay we are definitely vibing 🫶🫶",
  ],
};

function pickTemplate(templates: string[], seed: any, user: any): string {
  const tmpl = templates[Math.floor(Math.random() * templates.length)];
  const sharedInterest = (user.interests || []).find((i: string) =>
    (seed.interests || []).map((s: string) => s.toLowerCase()).includes(i.toLowerCase())
  ) || (user.interests || [])[0] || "music";
  return tmpl.replace("{interest}", sharedInterest);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const stats = { likesQueued: 0, matchesProcessed: 0, messagesQueued: 0, personalitiesAssigned: 0, skipped: 0 };

    // ── 1. Assign personalities to seeds that don't have one ──
    const { data: unassignedSeeds } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("is_seed", true)
      .is("seed_personality", null)
      .limit(100);

    if (unassignedSeeds?.length) {
      for (const seed of unassignedSeeds) {
        const personality = PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)];
        await supabase.from("user_profiles").update({ seed_personality: personality }).eq("id", seed.id);
        stats.personalitiesAssigned++;
      }
    }

    // ── 2. Process pending interactions (execute ones whose delay has passed) ──
    const now = new Date();
    const { data: pendingActions } = await supabase
      .from("seed_interaction_log")
      .select("*")
      .eq("status", "pending")
      .lte("created_at", new Date(now.getTime() - 60000).toISOString()) // at least 1 min old
      .limit(50);

    for (const action of pendingActions || []) {
      const delayMs = (action.delay_minutes || 0) * 60 * 1000;
      const executeAt = new Date(new Date(action.created_at).getTime() + delayMs);
      if (now < executeAt) continue; // Not time yet

      if (action.interaction_type === "like") {
        // Create the like
        const { data: seedProfile } = await supabase
          .from("user_profiles").select("user_id").eq("id", action.seed_profile_id).single();
        const { data: targetProfile } = await supabase
          .from("user_profiles").select("user_id").eq("id", action.target_profile_id).single();

        if (seedProfile && targetProfile) {
          // Check if already liked
          const { data: existing } = await supabase
            .from("likes").select("id")
            .eq("liker_id", action.seed_profile_id)
            .eq("liked_id", action.target_profile_id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("likes").insert({
              liker_id: action.seed_profile_id,
              liked_id: action.target_profile_id,
              liker_user_id: seedProfile.user_id,
              liked_user_id: targetProfile.user_id,
              is_super_like: false,
              is_seen: false,
            });

            // Send notification
            await supabase.from("notifications").insert({
              user_profile_id: action.target_profile_id,
              user_id: targetProfile.user_id,
              type: "like",
              title: "Someone likes you!",
              message: "A new person liked your profile 💕",
              from_profile_id: action.seed_profile_id,
              link_to: "/matches",
            });
            stats.likesQueued++;
          }
        }
      } else if (action.interaction_type === "match") {
        // Create mutual like + match
        const { data: seedProfile } = await supabase
          .from("user_profiles").select("id, user_id, display_name").eq("id", action.seed_profile_id).single();
        const { data: targetProfile } = await supabase
          .from("user_profiles").select("id, user_id, display_name").eq("id", action.target_profile_id).single();

        if (seedProfile && targetProfile) {
          // Ensure seed has liked the target
          const { data: existingLike } = await supabase
            .from("likes").select("id")
            .eq("liker_id", action.seed_profile_id)
            .eq("liked_id", action.target_profile_id)
            .maybeSingle();

          if (!existingLike) {
            await supabase.from("likes").insert({
              liker_id: action.seed_profile_id,
              liked_id: action.target_profile_id,
              liker_user_id: seedProfile.user_id,
              liked_user_id: targetProfile.user_id,
              is_super_like: false,
              is_seen: true,
            });
          }

          // Check no existing match
          const { data: existingMatch } = await supabase
            .from("matches").select("id")
            .or(`and(user1_id.eq.${action.seed_profile_id},user2_id.eq.${action.target_profile_id}),and(user1_id.eq.${action.target_profile_id},user2_id.eq.${action.seed_profile_id})`)
            .maybeSingle();

          if (!existingMatch) {
            await supabase.from("matches").insert({
              user1_id: action.target_profile_id,
              user2_id: action.seed_profile_id,
              user1_user_id: targetProfile.user_id,
              user2_user_id: seedProfile.user_id,
              user1_liked: true,
              user2_liked: true,
              is_match: true,
              matched_at: now.toISOString(),
              expires_at: new Date(now.getTime() + 86400000).toISOString(),
              is_expired: false,
              last_chance_sent: false,
              first_message_sent: false,
              status: "active",
            });

            await supabase.from("notifications").insert({
              user_profile_id: action.target_profile_id,
              user_id: targetProfile.user_id,
              type: "match",
              title: "It's a Match! 💕",
              message: `You and ${seedProfile.display_name} liked each other!`,
              from_profile_id: action.seed_profile_id,
              link_to: "/matches",
            });
            stats.matchesProcessed++;
          }
        }
      } else if (action.interaction_type === "message") {
        // Send a message in an existing match
        const { data: seedProfile } = await supabase
          .from("user_profiles").select("id, user_id, display_name").eq("id", action.seed_profile_id).single();
        const { data: targetProfile } = await supabase
          .from("user_profiles").select("id, user_id").eq("id", action.target_profile_id).single();

        if (seedProfile && targetProfile && action.message_content) {
          const { data: match } = await supabase
            .from("matches").select("id")
            .or(`and(user1_id.eq.${action.seed_profile_id},user2_id.eq.${action.target_profile_id}),and(user1_id.eq.${action.target_profile_id},user2_id.eq.${action.seed_profile_id})`)
            .eq("status", "active")
            .maybeSingle();

          if (match) {
            await supabase.from("messages").insert({
              match_id: match.id,
              sender_id: action.seed_profile_id,
              receiver_id: action.target_profile_id,
              sender_user_id: seedProfile.user_id,
              receiver_user_id: targetProfile.user_id,
              content: action.message_content,
              message_type: "text",
            });

            await supabase.from("notifications").insert({
              user_profile_id: action.target_profile_id,
              user_id: targetProfile.user_id,
              type: "message",
              title: `${seedProfile.display_name} sent you a message`,
              message: action.message_content.substring(0, 50) + (action.message_content.length > 50 ? "..." : ""),
              from_profile_id: action.seed_profile_id,
              link_to: `/chat?matchId=${match.id}`,
            });
            stats.messagesQueued++;
          }
        }
      }

      await supabase.from("seed_interaction_log").update({ status: "executed", executed_at: now.toISOString() }).eq("id", action.id);
    }

    // ── 3. Smart likes: Seeds proactively like compatible real users ──
    const { data: seedProfiles } = await supabase
      .from("user_profiles")
      .select("id, user_id, birth_date, interests, current_country, current_city, seed_personality, gender, looking_for, seed_interaction_count")
      .eq("is_seed", true)
      .eq("is_active", true)
      .limit(20);

    const { data: realUsers } = await supabase
      .from("user_profiles")
      .select("id, user_id, birth_date, interests, current_country, current_city, gender, looking_for, last_active")
      .eq("is_seed", false)
      .eq("is_active", true)
      .eq("is_banned", false)
      .limit(200);

    for (const seed of seedProfiles || []) {
      const personality = getPersonality(seed);

      // Limit total interactions per seed
      if ((seed.seed_interaction_count || 0) >= personality.maxInteractions * 5) continue;

      // Filter compatible users by gender prefs
      const compatible = (realUsers || []).filter((u) => {
        if (seed.looking_for?.length && !seed.looking_for.includes(u.gender)) return false;
        if (u.looking_for?.length && !u.looking_for.includes(seed.gender)) return false;
        return true;
      });

      // Pick up to 2 users to potentially like per cycle
      const shuffled = compatible.sort(() => Math.random() - 0.5).slice(0, 3);

      for (const user of shuffled) {
        const score = compatibilityScore(seed, user);
        const adjustedLikeChance = personality.likeChance * (score / 100);

        if (Math.random() > adjustedLikeChance) {
          stats.skipped++;
          continue;
        }

        // Check if already interacted
        const { data: existingInteraction } = await supabase
          .from("seed_interaction_log")
          .select("id")
          .eq("seed_profile_id", seed.id)
          .eq("target_profile_id", user.id)
          .eq("interaction_type", "like")
          .maybeSingle();

        if (existingInteraction) continue;

        const delay = randBetween(1, 10);
        await supabase.from("seed_interaction_log").insert({
          seed_profile_id: seed.id,
          target_profile_id: user.id,
          interaction_type: "like",
          delay_minutes: delay,
          personality: seed.seed_personality,
        });

        await supabase.from("user_profiles").update({
          seed_interaction_count: (seed.seed_interaction_count || 0) + 1,
          seed_last_action_at: now.toISOString(),
        }).eq("id", seed.id);

        stats.likesQueued++;
      }
    }

    // ── 4. Handle matches: When real users liked seeds, sometimes match back ──
    const { data: unreciprocatedLikes } = await supabase
      .from("likes")
      .select("id, liker_id, liked_id")
      .in("liked_id", (seedProfiles || []).map((s) => s.id))
      .limit(50);

    for (const like of unreciprocatedLikes || []) {
      const seed = (seedProfiles || []).find((s) => s.id === like.liked_id);
      if (!seed) continue;

      const personality = getPersonality(seed);

      // Check if we already queued a match response
      const { data: existingAction } = await supabase
        .from("seed_interaction_log")
        .select("id")
        .eq("seed_profile_id", seed.id)
        .eq("target_profile_id", like.liker_id)
        .in("interaction_type", ["match", "like"])
        .maybeSingle();

      if (existingAction) continue;

      // Should we skip matching?
      if (Math.random() < personality.matchSkipChance) {
        stats.skipped++;
        continue;
      }

      const delay = randBetween(personality.matchDelay[0], personality.matchDelay[1]);

      // Queue the match
      await supabase.from("seed_interaction_log").insert({
        seed_profile_id: seed.id,
        target_profile_id: like.liker_id,
        interaction_type: "match",
        delay_minutes: delay,
        personality: seed.seed_personality,
      });

      // Also queue a first message after the match (with additional delay)
      const targetUser = (realUsers || []).find((u) => u.id === like.liker_id);
      if (targetUser && Math.random() < personality.replyChance) {
        const msgDelay = delay + randBetween(personality.replyDelay[0], personality.replyDelay[1]);
        const templates = MESSAGE_TEMPLATES[seed.seed_personality || "playful"];
        const message = pickTemplate(templates, seed, targetUser);

        await supabase.from("seed_interaction_log").insert({
          seed_profile_id: seed.id,
          target_profile_id: like.liker_id,
          interaction_type: "message",
          delay_minutes: msgDelay,
          personality: seed.seed_personality,
          message_content: message,
        });
        stats.messagesQueued++;
      }

      stats.matchesProcessed++;
    }

    // ── 5. Reply to user messages in existing seed matches ──
    const seedIds = (seedProfiles || []).map((s) => s.id);
    if (seedIds.length > 0) {
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("id, match_id, sender_id, receiver_id, content, created_at")
        .in("receiver_id", seedIds)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(30);

      for (const msg of unreadMessages || []) {
        const seed = (seedProfiles || []).find((s) => s.id === msg.receiver_id);
        if (!seed) continue;

        const personality = getPersonality(seed);

        // Check interaction count for this conversation
        const { count } = await supabase
          .from("seed_interaction_log")
          .select("id", { count: "exact" })
          .eq("seed_profile_id", seed.id)
          .eq("target_profile_id", msg.sender_id)
          .eq("interaction_type", "message");

        const msgCount = count || 0;

        // Gradually reduce response frequency
        const fadeChance = Math.max(0, personality.replyChance - msgCount * 0.1);
        if (Math.random() > fadeChance) {
          stats.skipped++;
          continue;
        }

        // Check not already queued a reply
        const { data: existingReply } = await supabase
          .from("seed_interaction_log")
          .select("id")
          .eq("seed_profile_id", seed.id)
          .eq("target_profile_id", msg.sender_id)
          .eq("interaction_type", "message")
          .eq("status", "pending")
          .maybeSingle();

        if (existingReply) continue;

        const delay = randBetween(personality.replyDelay[0], personality.replyDelay[1]);
        const templates = REPLY_TEMPLATES[seed.seed_personality || "playful"];
        const reply = templates[Math.floor(Math.random() * templates.length)];

        await supabase.from("seed_interaction_log").insert({
          seed_profile_id: seed.id,
          target_profile_id: msg.sender_id,
          interaction_type: "message",
          delay_minutes: delay,
          personality: seed.seed_personality,
          message_content: reply,
        });

        // Mark seed message as read
        await supabase.from("messages").update({ is_read: true, read_at: now.toISOString() }).eq("id", msg.id);

        stats.messagesQueued++;
      }
    }

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed engine error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
