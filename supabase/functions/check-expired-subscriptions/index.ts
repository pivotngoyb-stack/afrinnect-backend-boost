import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // Find expired subscriptions
    const { data: expired, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lte("end_date", now)
      .limit(100);

    if (error) throw error;

    let checked = (expired || []).length;
    let downgraded = 0;

    for (const sub of (expired || [])) {
      // Mark subscription as expired
      await supabase
        .from("subscriptions")
        .update({
          status: "expired",
          updated_at: now,
        })
        .eq("id", sub.id);

      // Downgrade user profile to free tier
      await supabase
        .from("user_profiles")
        .update({
          subscription_tier: "free",
          updated_at: now,
        })
        .eq("id", sub.user_profile_id);

      // Notify user
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        user_profile_id: sub.user_profile_id,
        type: "subscription_expired",
        title: "Subscription Expired",
        message: "Your subscription has expired. Upgrade to continue enjoying premium features.",
        is_read: false,
      });

      downgraded++;
    }

    // Also check founding member trials
    const { data: expiredTrials } = await supabase
      .from("user_profiles")
      .select("id, user_id, founding_member_trial_end")
      .eq("is_founding_member", true)
      .eq("subscription_tier", "premium")
      .lte("founding_member_trial_end", now)
      .limit(100);

    let trialsExpired = 0;
    for (const profile of (expiredTrials || [])) {
      await supabase
        .from("user_profiles")
        .update({
          subscription_tier: "free",
          updated_at: now,
        })
        .eq("id", profile.id);

      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        user_profile_id: profile.id,
        type: "trial_expired",
        title: "Founding Member Trial Ended",
        message: "Your free premium trial has ended. Subscribe to keep your premium features!",
        is_read: false,
      });

      trialsExpired++;
    }

    return new Response(
      JSON.stringify({ checked, downgraded, trials_expired: trialsExpired }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
