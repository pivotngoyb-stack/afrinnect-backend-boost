import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function now returns RevenueCat offering info instead of Stripe checkout
// Actual purchase happens natively via RevenueCat SDK in the mobile app
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { plan_key } = await req.json();

    // Return the RevenueCat product ID mapping for the client to initiate native purchase
    const PRODUCT_MAP: Record<string, string> = {
      premium_monthly: 'afrinnect_premium_monthly',
      premium_quarterly: 'afrinnect_premium_quarterly',
      premium_yearly: 'afrinnect_premium_yearly',
      elite_monthly: 'afrinnect_elite_monthly',
      elite_quarterly: 'afrinnect_elite_quarterly',
      elite_yearly: 'afrinnect_elite_yearly',
      vip_monthly: 'afrinnect_vip_monthly',
      vip_quarterly: 'afrinnect_vip_quarterly',
      vip_yearly: 'afrinnect_vip_yearly',
    };

    const productId = PRODUCT_MAP[plan_key];
    if (!productId) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      product_id: productId,
      plan_key,
      message: 'Use RevenueCat SDK to purchase this product natively',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
