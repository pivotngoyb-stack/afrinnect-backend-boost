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
    const { image_url, content_type, user_profile_id } = body;
    // content_type: "photo", "profile_bio", "message"

    if (!image_url && !body.text_content) {
      return new Response(JSON.stringify({ error: "image_url or text_content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let moderationResult: any = null;

    if (image_url) {
      // Image moderation via AI vision
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a content moderation system for a dating app. Analyze this image and return ONLY valid JSON with NO markdown formatting:
{
  "is_safe": true/false,
  "confidence": 0-100,
  "flags": ["list of issues if any"],
  "category": "safe" | "nsfw" | "violence" | "hate" | "spam" | "fake",
  "action": "approve" | "flag_review" | "reject",
  "reason": "brief explanation"
}

Rules:
- Nudity/explicit content = reject
- Violence/gore = reject  
- Hate symbols = reject
- Stock photos/obviously fake = flag_review
- Low quality/blurry = flag_review
- Normal photos of people = approve
- Scenery/pets/food = approve`,
                },
                { type: "image_url", image_url: { url: image_url } },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          moderationResult = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (body.text_content) {
      // Text moderation
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a content moderation system for an African dating app. Return ONLY valid JSON with NO markdown:
{
  "is_safe": true/false,
  "confidence": 0-100,
  "flags": ["list of issues"],
  "category": "safe" | "harassment" | "hate_speech" | "spam" | "scam" | "explicit",
  "action": "approve" | "flag_review" | "reject",
  "reason": "brief explanation"
}

Flag: explicit solicitation, scam patterns (asking for money, crypto), harassment, hate speech, contact info sharing in early messages.`,
            },
            { role: "user", content: body.text_content },
          ],
          max_tokens: 200,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          moderationResult = JSON.parse(jsonMatch[0]);
        }
      }
    }

    if (!moderationResult) {
      moderationResult = { is_safe: true, confidence: 0, action: "flag_review", reason: "AI unavailable" };
    }

    // Log moderation result
    await supabase.from("content_moderations").insert({
      user_id: user.id,
      user_profile_id: user_profile_id || null,
      content_type: content_type || (image_url ? "photo" : "text"),
      content_url: image_url || null,
      text_content: body.text_content || null,
      ai_result: moderationResult,
      status: moderationResult.action,
      confidence: moderationResult.confidence,
    });

    // If rejected, auto-flag the user profile for review
    if (moderationResult.action === "reject" && user_profile_id) {
      await supabase.from("fake_profile_detections").insert({
        user_profile_id,
        detection_type: "content_moderation",
        confidence_score: moderationResult.confidence,
        flags: { category: moderationResult.category, reason: moderationResult.reason },
        status: "pending",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        moderation: moderationResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Content moderation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
