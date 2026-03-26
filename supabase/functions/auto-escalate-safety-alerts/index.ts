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

    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // Find unresolved safety reports older than 15 minutes
    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .in("status", ["pending", "under_review"])
      .eq("category", "safety")
      .lte("created_at", fifteenMinAgo)
      .limit(50);

    if (error) throw error;

    let alertsChecked = (reports || []).length;
    let escalated = 0;

    for (const report of (reports || [])) {
      // Escalate to urgent priority
      await supabase
        .from("reports")
        .update({
          status: "escalated",
          updated_at: new Date().toISOString(),
          admin_notes: (report.admin_notes || "") + "\n[AUTO] Escalated due to response time SLA breach.",
        })
        .eq("id", report.id);

      // Create admin notification
      await supabase.from("notifications").insert({
        user_id: "system",
        user_profile_id: "system",
        type: "safety_escalation",
        title: "Safety Alert Escalated",
        message: `Report #${report.id.slice(0, 8)} has been auto-escalated after 15 minutes without resolution.`,
        is_read: false,
      });

      escalated++;
    }

    return new Response(
      JSON.stringify({ alerts_checked: alertsChecked, escalated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
