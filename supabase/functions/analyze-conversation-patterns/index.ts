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

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Get recent messages to analyze
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, sender_profile_id, content, created_at")
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    let analyzed = 0;
    let flagged = 0;
    const suspiciousPatterns = [
      /\b(whatsapp|telegram|signal)\b/i,
      /\b(send money|wire transfer|western union|moneygram|bitcoin|crypto)\b/i,
      /\b(account number|bank details|routing number)\b/i,
      /\b(click here|visit this link)\b/i,
      /(https?:\/\/[^\s]+){3,}/i, // Multiple URLs
    ];

    // Group messages by sender to detect spam patterns
    const senderMessages: Record<string, string[]> = {};
    for (const msg of (messages || [])) {
      if (!senderMessages[msg.sender_profile_id]) {
        senderMessages[msg.sender_profile_id] = [];
      }
      senderMessages[msg.sender_profile_id].push(msg.content || "");
      analyzed++;
    }

    for (const [senderId, msgs] of Object.entries(senderMessages)) {
      // Check for repeated identical messages (spam)
      const uniqueMessages = new Set(msgs);
      const isSpamming = msgs.length > 5 && uniqueMessages.size < msgs.length * 0.3;

      // Check for suspicious content
      const hasSuspiciousContent = msgs.some((content) =>
        suspiciousPatterns.some((pattern) => pattern.test(content))
      );

      if (isSpamming || hasSuspiciousContent) {
        await supabase.from("content_moderations").insert({
          user_id: senderId,
          user_profile_id: senderId,
          content_type: "conversation_pattern",
          text_content: `Pattern detected: ${isSpamming ? "spam" : "suspicious content"}`,
          status: "flagged",
          ai_result: {
            is_spamming: isSpamming,
            has_suspicious_content: hasSuspiciousContent,
            message_count: msgs.length,
          },
        });
        flagged++;
      }
    }

    return new Response(
      JSON.stringify({ analyzed, flagged, senders_checked: Object.keys(senderMessages).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
