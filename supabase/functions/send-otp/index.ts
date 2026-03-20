import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { phone_number, email, type = 'sms' } = await req.json();

    if (!phone_number && !email) {
      return new Response(JSON.stringify({ error: 'phone_number or email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (email) {
      // Use Supabase built-in OTP for email
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Verification code sent to your email',
        method: 'email'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (phone_number) {
      // Use Supabase built-in phone OTP
      const { error } = await supabase.auth.signInWithOtp({ phone: phone_number });
      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Verification code sent to your phone',
        method: 'sms'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
