import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RevenueCat event types we care about
const SUBSCRIPTION_EVENTS = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'UNCANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
  'PRODUCT_CHANGE',
];

// Map RevenueCat product IDs to our tier system
function mapProductToTier(productId: string): { tier: string; billing_cycle: string } | null {
  const map: Record<string, { tier: string; billing_cycle: string }> = {
    'afrinnect_premium_monthly': { tier: 'premium', billing_cycle: 'monthly' },
    'afrinnect_premium_quarterly': { tier: 'premium', billing_cycle: 'quarterly' },
    'afrinnect_premium_yearly': { tier: 'premium', billing_cycle: 'yearly' },
    'afrinnect_elite_monthly': { tier: 'elite', billing_cycle: 'monthly' },
    'afrinnect_elite_quarterly': { tier: 'elite', billing_cycle: 'quarterly' },
    'afrinnect_elite_yearly': { tier: 'elite', billing_cycle: 'yearly' },
    'afrinnect_vip_monthly': { tier: 'vip', billing_cycle: 'monthly' },
    'afrinnect_vip_quarterly': { tier: 'vip', billing_cycle: 'quarterly' },
    'afrinnect_vip_yearly': { tier: 'vip', billing_cycle: 'yearly' },
  };
  return map[productId] || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify webhook auth
    const authHeader = req.headers.get('Authorization');
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.error('Invalid webhook authorization');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json();
    const event = body.event;
    
    if (!event) {
      return new Response(JSON.stringify({ error: 'No event data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const eventType = event.type;
    console.log(`RevenueCat event: ${eventType}`, JSON.stringify(event).substring(0, 500));

    if (!SUBSCRIPTION_EVENTS.includes(eventType)) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user info — RevenueCat sends app_user_id which we set to our user_id
    const appUserId = event.app_user_id;
    const productId = event.product_id;
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;
    const purchasedAt = event.purchased_at_ms ? new Date(event.purchased_at_ms).toISOString() : null;
    const store = event.store; // APP_STORE, PLAY_STORE
    const environment = event.environment; // PRODUCTION, SANDBOX

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, subscription_tier')
      .eq('user_id', appUserId)
      .single();

    if (!profile) {
      console.error(`No profile found for user: ${appUserId}`);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tierInfo = mapProductToTier(productId);

    switch (eventType) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE': {
        if (!tierInfo) {
          console.error(`Unknown product: ${productId}`);
          break;
        }

        // Update user profile tier
        await supabase
          .from('user_profiles')
          .update({ subscription_tier: tierInfo.tier })
          .eq('id', profile.id);

        // Upsert subscription record
        await supabase
          .from('subscriptions')
          .upsert({
            user_profile_id: profile.id,
            tier: tierInfo.tier,
            billing_cycle: tierInfo.billing_cycle,
            status: 'active',
            payment_provider: store === 'APP_STORE' ? 'apple' : 'google',
            provider_subscription_id: event.original_transaction_id || event.transaction_id,
            current_period_start: purchasedAt,
            current_period_end: expiresAt,
            environment: environment?.toLowerCase() || 'production',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_profile_id',
          });

        console.log(`Activated ${tierInfo.tier} for user ${appUserId}`);
        break;
      }

      case 'CANCELLATION': {
        // Mark as cancelled but don't downgrade until expiration
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_profile_id', profile.id)
          .eq('status', 'active');

        console.log(`Cancelled subscription for user ${appUserId}`);
        break;
      }

      case 'EXPIRATION': {
        // Downgrade to free
        await supabase
          .from('user_profiles')
          .update({ subscription_tier: 'free' })
          .eq('id', profile.id);

        await supabase
          .from('subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('user_profile_id', profile.id)
          .in('status', ['active', 'cancelled']);

        console.log(`Expired subscription for user ${appUserId}`);
        break;
      }

      case 'BILLING_ISSUE': {
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'billing_issue',
            updated_at: new Date().toISOString(),
          })
          .eq('user_profile_id', profile.id)
          .eq('status', 'active');

        console.log(`Billing issue for user ${appUserId}`);
        break;
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('RevenueCat webhook error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
