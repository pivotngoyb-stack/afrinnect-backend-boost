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
    const { centerUrl, leftUrl, rightUrl, selfie_url, profile_photo_url, user_profile_id } = body;

    // Support both old format (selfie_url) and new format (centerUrl/leftUrl/rightUrl)
    const mainSelfie = selfie_url || centerUrl;

    // Look up user profile if not provided
    let profileId = user_profile_id;
    let profilePhotoUrl = profile_photo_url;

    if (!profileId || !profilePhotoUrl) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id, photos")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        profileId = profileId || profile.id;
        if (!profilePhotoUrl && profile.photos && Array.isArray(profile.photos) && profile.photos.length > 0) {
          profilePhotoUrl = profile.photos[0];
        }
      }
    }

    if (!mainSelfie) {
      return new Response(JSON.stringify({ error: "At least one selfie photo is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profileId) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a verification record
    const { data: verification, error: insertError } = await supabase
      .from("photo_verifications")
      .insert({
        user_id: user.id,
        user_profile_id: profileId,
        selfie_url: mainSelfie,
        profile_photo_url: profilePhotoUrl || null,
        status: "pending",
        verification_type: "video_selfie",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Use AI to verify the person
    let aiResult = null;
    try {
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableApiKey) {
        const imageContent: any[] = [
          {
            type: "text",
            text: `You are a photo verification system for a dating app. Your goal is to confirm a real person is behind the account — NOT to be a strict biometric scanner.

Analyze the provided selfie images to determine:
1. Is there a real human face clearly visible in the selfie(s)?
2. Does the person appear to be a real, live person (not a photo-of-a-photo, a screen capture, or a printed image)?
3. If a profile photo is also provided, do the selfie(s) appear to be the SAME PERSON as in the profile photo?

IMPORTANT GUIDELINES FOR MATCHING:
- Photos may have Instagram/Snapchat/beauty filters, different lighting, makeup levels, or color grading. This is NORMAL and should NOT reduce confidence.
- Focus on STRUCTURAL facial features: face shape, eye spacing, nose bridge shape, jawline, ear position — these persist through filters.
- Different angles (front, left, right), expressions (smiling vs neutral), and hairstyles are expected and acceptable.
- Glasses on/off, different makeup, skin smoothing filters, or color filters should NOT count against a match.
- Only flag as non-matching if the bone structure or fundamental facial geometry clearly differs (different person entirely).
- A confidence of 60+ means you believe it is more likely than not the same person. Err on the side of approval when features broadly align.

Use MULTIPLE verification signals:
- Face shape and proportions
- Eye shape and spacing
- Nose and mouth structure
- Hairline pattern (if visible)
- Skin tone range (accounting for filters/lighting)
- Overall head proportions

Reply with ONLY this JSON:
{"verified": true/false, "confidence": 0-100, "is_real_person": true/false, "faces_match": true/false/null, "reason": "brief explanation", "signals_matched": ["list of matching features"], "signals_mismatched": ["list of differing features"]}`,
          },
          { type: "image_url", image_url: { url: mainSelfie } },
        ];

        // Add additional pose images if provided
        if (leftUrl) {
          imageContent.push({ type: "image_url", image_url: { url: leftUrl } });
        }
        if (rightUrl) {
          imageContent.push({ type: "image_url", image_url: { url: rightUrl } });
        }
        // Add profile photo for comparison if available
        if (profilePhotoUrl) {
          imageContent.push({ type: "text", text: "This is the user's current profile photo for comparison:" });
          imageContent.push({ type: "image_url", image_url: { url: profilePhotoUrl } });
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
        } else {
          console.error("AI response error:", aiResponse.status, await aiResponse.text());
        }
      }
    } catch (aiErr) {
      console.error("AI comparison error:", aiErr);
    }

    // Determine approval: real person + (faces match if profile photo exists)
    const isApproved = aiResult?.is_real_person && 
      aiResult?.confidence > 60 && 
      (profilePhotoUrl ? aiResult?.faces_match !== false : true);

    const newStatus = isApproved ? "approved" : "pending_review";
    const verified = isApproved;

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
        .eq("id", profileId);
    }

    // Log audit
    await supabase.from("admin_audit_logs").insert({
      admin_user_id: user.id,
      action: "photo_verification_submitted",
      target_type: "user_profile",
      target_id: profileId,
      details: { status: newStatus, ai_confidence: aiResult?.confidence || null },
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified,
        verification_id: verification.id,
        status: newStatus,
        confidence: aiResult?.confidence || null,
        reason: aiResult?.reason || (verified ? "Verification successful" : "Could not verify identity"),
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
