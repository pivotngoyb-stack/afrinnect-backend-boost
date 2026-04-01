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

    const { action, target_profile_id, match_id } = await req.json();
    // action: "block" or "unblock"

    if (!action || !target_profile_id) {
      return new Response(JSON.stringify({ error: "action and target_profile_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["block", "unblock"].includes(action)) {
      return new Response(JSON.stringify({ error: "action must be 'block' or 'unblock'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the requesting user's profile
    const { data: myProfile, error: profileErr } = await supabase
      .from("user_profiles")
      .select("id, blocked_users")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileErr || !myProfile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent blocking yourself
    if (target_profile_id === myProfile.id) {
      return new Response(JSON.stringify({ error: "Cannot block yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify target exists
    const { data: targetProfile } = await supabase
      .from("user_profiles")
      .select("id, display_name")
      .eq("id", target_profile_id)
      .maybeSingle();

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: "Target user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentBlocked = myProfile.blocked_users || [];

    if (action === "block") {
      // Add to blocked list if not already there
      if (currentBlocked.includes(target_profile_id)) {
        return new Response(JSON.stringify({ success: true, message: "User already blocked" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updatedBlocked = [...currentBlocked, target_profile_id];
      await supabase
        .from("user_profiles")
        .update({ blocked_users: updatedBlocked })
        .eq("id", myProfile.id);

      // Also block any active match between the two users
      if (match_id) {
        await supabase
          .from("matches")
          .update({ status: "blocked" })
          .eq("id", match_id);
      } else {
        // Find and block any active match
        const { data: matches } = await supabase
          .from("matches")
          .select("id")
          .or(`and(user1_id.eq.${myProfile.id},user2_id.eq.${target_profile_id}),and(user1_id.eq.${target_profile_id},user2_id.eq.${myProfile.id})`)
          .neq("status", "blocked");

        if (matches && matches.length > 0) {
          for (const m of matches) {
            await supabase
              .from("matches")
              .update({ status: "blocked" })
              .eq("id", m.id);
          }
        }
      }

      // Structured log for admin visibility (not admin_audit_logs — this is a user action)
      console.log(JSON.stringify({ action: 'user_blocked', actor: myProfile.id, target: target_profile_id, ts: new Date().toISOString() }));

      return new Response(
        JSON.stringify({ success: true, message: `Blocked ${targetProfile.display_name}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // Unblock
      if (!currentBlocked.includes(target_profile_id)) {
        return new Response(JSON.stringify({ success: true, message: "User not blocked" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updatedBlocked = currentBlocked.filter((id: string) => id !== target_profile_id);
      await supabase
        .from("user_profiles")
        .update({ blocked_users: updatedBlocked })
        .eq("id", myProfile.id);

      console.log(JSON.stringify({ action: 'user_unblocked', actor: myProfile.id, target: target_profile_id, ts: new Date().toISOString() }));

      return new Response(
        JSON.stringify({ success: true, message: `Unblocked ${targetProfile.display_name}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Block user error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
