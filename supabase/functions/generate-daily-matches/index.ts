import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    // Get all active profiles
    const { data: profiles, error: profilesErr } = await supabase
      .from("user_profiles")
      .select("id, user_id, gender, looking_for, birth_date, current_country, interests, religion, education, relationship_goal, subscription_tier")
      .eq("is_active", true)
      .limit(1000);

    if (profilesErr) throw profilesErr;
    if (!profiles || profiles.length < 2) {
      return new Response(JSON.stringify({ success: true, message: "Not enough profiles", matches_created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing matches to avoid duplicates
    const { data: existingMatches } = await supabase
      .from("matches")
      .select("user1_id, user2_id");

    const matchedPairs = new Set(
      (existingMatches || []).map((m) => [m.user1_id, m.user2_id].sort().join("-"))
    );

    // Get today's already generated daily matches
    const { data: todayMatches } = await supabase
      .from("daily_matches")
      .select("user_profile_id")
      .eq("date", today);

    const alreadyGenerated = new Set((todayMatches || []).map((m) => m.user_profile_id));

    let totalCreated = 0;
    const MATCHES_PER_USER = 5;

    for (const profile of profiles) {
      if (alreadyGenerated.has(profile.id)) continue;

      // Score all other profiles
      const candidates = profiles
        .filter((p) => p.id !== profile.id)
        .map((candidate) => {
          let score = 0;
          const reasons: string[] = [];

          // Gender preference match
          if (profile.looking_for && candidate.gender) {
            if (profile.looking_for === candidate.gender || profile.looking_for === "everyone") {
              score += 30;
              reasons.push("Gender preference match");
            } else {
              return null; // Skip incompatible gender preferences
            }
          }

          // Reverse check: does the candidate want this profile's gender?
          if (candidate.looking_for && profile.gender) {
            if (candidate.looking_for !== profile.gender && candidate.looking_for !== "everyone") {
              return null;
            }
          }

          // Country match
          if (profile.current_country && candidate.current_country && profile.current_country === candidate.current_country) {
            score += 15;
            reasons.push("Same country");
          }

          // Age compatibility (within 5 years)
          const getAge = (bd: string) => {
            if (!bd) return null;
            const diff = Date.now() - new Date(bd).getTime();
            return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
          };
          const pAge = getAge(profile.birth_date);
          const cAge = getAge(candidate.birth_date);
          if (pAge && cAge) {
            const ageDiff = Math.abs(pAge - cAge);
            if (ageDiff <= 3) { score += 15; reasons.push("Close in age"); }
            else if (ageDiff <= 5) { score += 10; reasons.push("Similar age"); }
            else if (ageDiff <= 10) { score += 5; }
          }

          // Shared interests
          if (profile.interests && candidate.interests) {
            const pInterests = Array.isArray(profile.interests) ? profile.interests : [];
            const cInterests = Array.isArray(candidate.interests) ? candidate.interests : [];
            const shared = pInterests.filter((i: string) => cInterests.includes(i));
            if (shared.length >= 3) { score += 20; reasons.push(`${shared.length} shared interests`); }
            else if (shared.length >= 1) { score += 10; reasons.push("Common interests"); }
          }

          // Religion match
          if (profile.religion && candidate.religion && profile.religion === candidate.religion) {
            score += 10;
            reasons.push("Same faith");
          }

          // Relationship goal match
          if (profile.relationship_goal && candidate.relationship_goal &&
              profile.relationship_goal === candidate.relationship_goal) {
            score += 10;
            reasons.push("Same relationship goals");
          }

          // Already matched = skip
          const pairKey = [profile.id, candidate.id].sort().join("-");
          if (matchedPairs.has(pairKey)) return null;

          return { candidateId: candidate.id, score, reasons };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, MATCHES_PER_USER);

      if (candidates.length === 0) continue;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const dailyMatchRows = candidates.map((c: any) => ({
        user_profile_id: profile.id,
        suggested_profile_id: c.candidateId,
        match_score: c.score,
        match_reasons: c.reasons,
        date: today,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      }));

      const { error: insertErr } = await supabase
        .from("daily_matches")
        .insert(dailyMatchRows);

      if (!insertErr) {
        totalCreated += dailyMatchRows.length;
      }
    }

    console.log(`Daily matches generated: ${totalCreated} for date ${today}`);

    return new Response(
      JSON.stringify({ success: true, matches_created: totalCreated, date: today }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily match generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
