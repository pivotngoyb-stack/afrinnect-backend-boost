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

    // Get pending photo verifications
    const { data: pending, error } = await supabase
      .from("photo_verifications")
      .select("*")
      .eq("status", "pending")
      .limit(50);

    if (error) throw error;

    let processed = 0;
    let approved = 0;
    let rejected = 0;

    for (const verification of (pending || [])) {
      // Auto-approve if selfie_url and photo_url both exist
      const hasRequiredPhotos = verification.selfie_url && verification.photo_url;
      const newStatus = hasRequiredPhotos ? "approved" : "rejected";

      await supabase
        .from("photo_verifications")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: "auto-system",
        })
        .eq("id", verification.id);

      if (newStatus === "approved") {
        await supabase
          .from("user_profiles")
          .update({ is_photo_verified: true })
          .eq("id", verification.user_profile_id);
        approved++;
      } else {
        rejected++;
      }
      processed++;
    }

    // Also process pending ID verifications
    const { data: pendingIds } = await supabase
      .from("id_verifications")
      .select("*")
      .eq("status", "pending")
      .limit(50);

    for (const idv of (pendingIds || [])) {
      const hasDoc = idv.id_front_url;
      const newStatus = hasDoc ? "approved" : "rejected";

      await supabase
        .from("id_verifications")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: "auto-system",
        })
        .eq("id", idv.id);

      if (newStatus === "approved") {
        await supabase
          .from("user_profiles")
          .update({ is_id_verified: true })
          .eq("id", idv.user_profile_id);
      }
      processed++;
    }

    return new Response(
      JSON.stringify({ processed, approved, rejected }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
