import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Price IDs mapped to plan keys — replace with real Stripe price IDs
const PRICE_MAP: Record<string, string> = {
  premium_monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') || 'price_premium_monthly',
  premium_quarterly: Deno.env.get('STRIPE_PRICE_PREMIUM_QUARTERLY') || 'price_premium_quarterly',
  premium_yearly: Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY') || 'price_premium_yearly',
  elite_monthly: Deno.env.get('STRIPE_PRICE_ELITE_MONTHLY') || 'price_elite_monthly',
  elite_quarterly: Deno.env.get('STRIPE_PRICE_ELITE_QUARTERLY') || 'price_elite_quarterly',
  elite_yearly: Deno.env.get('STRIPE_PRICE_ELITE_YEARLY') || 'price_elite_yearly',
  vip_monthly: Deno.env.get('STRIPE_PRICE_VIP_MONTHLY') || 'price_vip_monthly',
  vip_quarterly: Deno.env.get('STRIPE_PRICE_VIP_QUARTERLY') || 'price_vip_quarterly',
  vip_yearly: Deno.env.get('STRIPE_PRICE_VIP_YEARLY') || 'price_vip_yearly',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Auth
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

    const { plan_key, success_url, cancel_url } = await req.json();
    const priceId = PRICE_MAP[plan_key];
    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, stripe_customer_id, display_name')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.display_name || undefined,
        metadata: { user_id: user.id, profile_id: profile?.id },
      });
      customerId = customer.id;

      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: success_url || `${req.headers.get('origin')}/pricingplans?success=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/pricingplans?cancelled=true`,
      metadata: { user_id: user.id, plan_key },
      subscription_data: {
        metadata: { user_id: user.id, plan_key },
      },
    });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
