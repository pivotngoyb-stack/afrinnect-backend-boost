const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory rate limit store (resets on cold start, which is fine for edge functions)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, { maxAttempts: number; windowMs: number }> = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },       // 5 per 15 min
  signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },      // 3 per hour
  password_reset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  otp: { maxAttempts: 5, windowMs: 10 * 60 * 1000 },         // 5 per 10 min
  report: { maxAttempts: 10, windowMs: 60 * 60 * 1000 },     // 10 per hour
  default: { maxAttempts: 20, windowMs: 60 * 1000 },          // 20 per min
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, identifier } = await req.json();

    if (!action || !identifier) {
      return new Response(JSON.stringify({ error: 'action and identifier required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = `${action}:${identifier}`;
    const limit = LIMITS[action] || LIMITS.default;
    const now = Date.now();

    let entry = rateLimits.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + limit.windowMs };
      rateLimits.set(key, entry);
    }

    entry.count++;

    if (entry.count > limit.maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return new Response(JSON.stringify({
        allowed: false,
        error: `Too many ${action} attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
        retryAfter,
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
      });
    }

    return new Response(JSON.stringify({
      allowed: true,
      remaining: limit.maxAttempts - entry.count,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Rate limit error:', error);
    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
