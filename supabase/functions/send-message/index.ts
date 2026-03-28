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

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const { matchId, content, type = "text", mediaUrl = null } = await req.json();

    if (!matchId) {
      return new Response(JSON.stringify({ error: "matchId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!content && !mediaUrl) {
      return new Response(JSON.stringify({ error: "content or mediaUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get sender's profile
    const { data: senderProfile } = await supabase
      .from("user_profiles")
      .select("id, subscription_tier, is_banned, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!senderProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (senderProfile.is_banned) {
      return new Response(JSON.stringify({ error: "Account suspended" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the match exists and user is part of it
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (match.user1_id !== senderProfile.id && match.user2_id !== senderProfile.id) {
      return new Response(JSON.stringify({ error: "Not authorized for this match" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (match.status === "blocked" || match.status === "unmatched") {
      return new Response(JSON.stringify({ error: "This conversation is no longer active" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const receiverId = match.user1_id === senderProfile.id ? match.user2_id : match.user1_id;
    const receiverUserId = match.user1_user_id === user.id ? match.user2_user_id : match.user1_user_id;

    // Rate limit: max 20 messages per minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", senderProfile.id)
      .eq("match_id", matchId)
      .gte("created_at", oneMinuteAgo);

    if ((recentCount || 0) >= 20) {
      return new Response(JSON.stringify({ error: "Sending too quickly. Please wait." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Message limit check for free tier
    const tier = senderProfile.subscription_tier || "free";
    if (tier === "free") {
      const today = new Date().toISOString().split("T")[0];
      const { count: todayCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", senderProfile.id)
        .gte("created_at", `${today}T00:00:00`);

      if ((todayCount || 0) >= 50) {
        return new Response(JSON.stringify({ error: "upgrade_required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // AI content moderation for text messages
    let moderationResult = null;
    if (type === "text" && content) {
      try {
        const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
        if (lovableApiKey) {
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
                  content: `You are a content safety filter for a dating app. Analyze and return ONLY JSON (no markdown):
{"safe": true/false, "reason": "brief reason if unsafe"}
Flag: explicit sexual solicitation, threats, scam patterns (money requests, crypto), harassment, sharing personal contact info in first 5 messages, hate speech.
Allow: flirting, compliments, date planning, personal questions, humor.`,
                },
                { role: "user", content },
              ],
              max_tokens: 100,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiContent = aiData.choices?.[0]?.message?.content || "";
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              moderationResult = JSON.parse(jsonMatch[0]);
            }
          }
        }
      } catch (e) {
        console.error("Moderation error:", e);
        // Continue without moderation if AI fails
      }
    }

    // If content is flagged as unsafe, reject
    if (moderationResult && moderationResult.safe === false) {
      // Log the moderation event
      await supabase.from("content_moderations").insert({
        user_id: user.id,
        user_profile_id: senderProfile.id,
        content_type: "message",
        text_content: content,
        ai_result: moderationResult,
        status: "reject",
        confidence: 90,
      });

      return new Response(
        JSON.stringify({ error: "Message flagged by safety filter: " + (moderationResult.reason || "inappropriate content") }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        match_id: matchId,
        sender_id: senderProfile.id,
        sender_user_id: user.id,
        receiver_id: receiverId,
        receiver_user_id: receiverUserId,
        content: content || "",
        message_type: type,
        media_url: mediaUrl,
        is_read: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update match with first_message info if needed
    if (!match.first_message_sent) {
      await supabase
        .from("matches")
        .update({
          first_message_sent: true,
          first_message_sent_at: new Date().toISOString(),
          first_message_sent_by: senderProfile.id,
        })
        .eq("id", matchId);
    }

    // Create notification for receiver
    await supabase.from("notifications").insert({
      user_profile_id: receiverId,
      user_id: receiverUserId,
      type: "new_message",
      title: "New Message",
      message: `${senderProfile.display_name} sent you a message`,
      link_to: `/chat?matchId=${matchId}`,
      is_read: false,
    }).catch(() => {});

    // Send push notification to receiver
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          userId: receiverUserId,
          title: `${senderProfile.display_name}`,
          body: content?.substring(0, 100) || 'Sent you a message',
          type: 'message',
          data: { chatId: matchId },
        }),
      });
    } catch (pushErr) {
      console.warn('Push notification failed (message):', pushErr);
    }

    return new Response(
      JSON.stringify(message),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send message error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
