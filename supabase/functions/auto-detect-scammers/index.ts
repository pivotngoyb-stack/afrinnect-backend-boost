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

    // Check for profiles with multiple reports
    const { data: flaggedProfiles, error } = await supabase
      .from("reports")
      .select("reported_user_id")
      .eq("status", "pending")
      .limit(500);

    if (error) throw error;

    // Count reports per user
    const reportCounts: Record<string, number> = {};
    for (const report of (flaggedProfiles || [])) {
      const uid = report.reported_user_id;
      if (uid) reportCounts[uid] = (reportCounts[uid] || 0) + 1;
    }

    let detected = 0;
    let autoBanned = 0;

    for (const [userId, count] of Object.entries(reportCounts)) {
      if (count >= 3) {
        // Auto-flag as potential scammer
        await supabase.from("fake_profile_detections").insert({
          user_profile_id: userId,
          detection_type: "multi_report",
          confidence_score: Math.min(count * 20, 100),
          flags: { report_count: count, auto_detected: true },
          status: count >= 5 ? "confirmed" : "flagged",
        });

        detected++;

        // Auto-ban if 5+ reports
        if (count >= 5) {
          await supabase
            .from("user_profiles")
            .update({
              is_banned: true,
              ban_reason: "Auto-banned: Multiple safety reports",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          autoBanned++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        profiles_scanned: Object.keys(reportCounts).length,
        detected,
        auto_banned: autoBanned,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
