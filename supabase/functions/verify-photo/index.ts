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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user from JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { selfie_url, profile_photo_url, user_profile_id } = body;

    if (!selfie_url || !user_profile_id) {
      return new Response(JSON.stringify({ error: "selfie_url and user_profile_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a verification record
    const { data: verification, error: insertError } = await supabase
      .from("photo_verifications")
      .insert({
        user_id: user.id,
        user_profile_id,
        selfie_url,
        profile_photo_url: profile_photo_url || null,
        status: "pending",
        verification_type: "selfie_match",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Use AI to compare selfie with profile photo if both provided
    let aiResult = null;
    if (profile_photo_url) {
      try {
        const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
        if (lovableApiKey) {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${lovableApiKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: "Compare these two photos. Are they the same person? Reply with JSON: {\"match\": true/false, \"confidence\": 0-100, \"reason\": \"brief explanation\"}. Only return the JSON." },
                    { type: "image_url", image_url: { url: selfie_url } },
                    { type: "image_url", image_url: { url: profile_photo_url } },
                  ],
                },
              ],
              max_tokens: 200,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            // Parse JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiResult = JSON.parse(jsonMatch[0]);
            }
          }
        }
      } catch (aiErr) {
        console.error("AI comparison error:", aiErr);
        // Continue without AI — manual review will handle it
      }
    }

    // Update verification with AI result
    const newStatus = aiResult?.match && aiResult?.confidence > 70 ? "approved" : "pending_review";
    await supabase
      .from("photo_verifications")
      .update({
        status: newStatus,
        ai_result: aiResult || {},
        reviewed_at: newStatus === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", verification.id);

    // If approved, update profile verification status
    if (newStatus === "approved") {
      await supabase
        .from("user_profiles")
        .update({ is_photo_verified: true })
        .eq("id", user_profile_id);
    }

    // Log audit
    await supabase.from("admin_audit_logs").insert({
      admin_user_id: user.id,
      action: "photo_verification_submitted",
      target_type: "user_profile",
      target_id: user_profile_id,
      details: { status: newStatus, ai_confidence: aiResult?.confidence || null },
    });

    return new Response(
      JSON.stringify({
        success: true,
        verification_id: verification.id,
        status: newStatus,
        ai_result: aiResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Photo verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
