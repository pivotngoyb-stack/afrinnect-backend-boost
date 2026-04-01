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

    // Verify user
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
    const { id_front_url, id_back_url, id_type, user_profile_id } = body;

    if (!id_front_url || !id_type || !user_profile_id) {
      return new Response(
        JSON.stringify({ error: "id_front_url, id_type, and user_profile_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing pending verification
    const { data: existing } = await supabase
      .from("id_verifications")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "pending_review"])
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "You already have a pending ID verification", verification_id: existing[0].id }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create verification record
    const { data: verification, error: insertError } = await supabase
      .from("id_verifications")
      .insert({
        user_id: user.id,
        user_profile_id,
        id_front_url,
        id_back_url: id_back_url || null,
        id_type,
        status: "pending_review",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Use AI to extract and validate ID information
    let aiResult = null;
    try {
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableApiKey) {
        const imageContent: any[] = [
          {
            type: "text",
            text: `Analyze this ${id_type} document image. Extract: {"document_type": "...", "is_valid_document": true/false, "is_readable": true/false, "has_photo": true/false, "expiry_status": "valid/expired/unknown", "confidence": 0-100, "notes": "brief observations"}. Only return JSON.`,
          },
          { type: "image_url", image_url: { url: id_front_url } },
        ];
        if (id_back_url) {
          imageContent.push({ type: "image_url", image_url: { url: id_back_url } });
        }

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: imageContent }],
            max_tokens: 300,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResult = JSON.parse(jsonMatch[0]);
          }
        }
      }
    } catch (aiErr) {
      console.error("AI ID analysis error:", aiErr);
    }

    // Update with AI analysis
    const autoApprove =
      aiResult?.is_valid_document &&
      aiResult?.is_readable &&
      aiResult?.has_photo &&
      aiResult?.confidence > 80 &&
      aiResult?.expiry_status !== "expired";

    const newStatus = autoApprove ? "approved" : "pending_review";

    await supabase
      .from("id_verifications")
      .update({
        status: newStatus,
        ai_result: aiResult || {},
        reviewed_at: autoApprove ? new Date().toISOString() : null,
      })
      .eq("id", verification.id);

    // If approved, update profile
    if (autoApprove) {
      await supabase
        .from("user_profiles")
        .update({ is_id_verified: true })
        .eq("id", user_profile_id);
    }

    // Structured log (user-initiated verification, not admin action)
    console.log(JSON.stringify({ action: 'id_verification_submitted', profile_id: user_profile_id, id_type, status: newStatus, ai_confidence: aiResult?.confidence || null }));

    return new Response(
      JSON.stringify({
        success: true,
        verification_id: verification.id,
        status: newStatus,
        ai_analysis: aiResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ID verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
