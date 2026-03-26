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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Find users inactive for 7-30 days
    const { data: inactiveProfiles, error } = await supabase
      .from("user_profiles")
      .select("id, user_id, display_name, last_active")
      .lte("last_active", sevenDaysAgo)
      .gte("last_active", thirtyDaysAgo)
      .eq("is_active", true)
      .limit(100);

    if (error) throw error;

    let emailsSent = 0;

    for (const profile of (inactiveProfiles || [])) {
      // Create a notification as email placeholder
      await supabase.from("notifications").insert({
        user_id: profile.user_id,
        user_profile_id: profile.id,
        type: "winback",
        title: "We miss you! 💛",
        message: `Hey ${profile.display_name || "there"}! You have new potential matches waiting. Come back and see who's interested in you!`,
        is_read: false,
      });

      emailsSent++;
    }

    return new Response(
      JSON.stringify({ emailsSent, inactive_users_found: (inactiveProfiles || []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
