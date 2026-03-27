import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Get an OAuth2 access token from a Firebase service account JSON key.
 * This replaces the deprecated legacy server key approach.
 */
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const enc = (obj: any) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const unsignedToken = `${enc(header)}.${enc(payload)}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { userId, title, body, data, type } = await req.json();

    // Get user's push token
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('push_token, display_name, id')
      .eq('user_id', userId)
      .single();

    // Always create in-app notification
    if (profile) {
      await supabase.from('notifications').insert({
        user_profile_id: profile.id,
        user_id: userId,
        type: type || 'admin_message',
        title,
        message: body,
        is_read: false,
      });
    }

    if (!profile?.push_token) {
      return new Response(
        JSON.stringify({ success: true, push: false, reason: 'No push token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the FCM service account JSON
    const serviceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      return new Response(
        JSON.stringify({ success: true, push: false, reason: 'FCM not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    // Send via FCM v1 HTTP API
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: profile.push_token,
            notification: {
              title,
              body,
            },
            data: {
              ...(data || {}),
              type: type || 'general',
            },
            android: {
              priority: 'HIGH',
              notification: {
                sound: 'default',
                channel_id: 'default',
                click_action: 'FCM_PLUGIN_ACTIVITY',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  'content-available': 1,
                },
              },
            },
          },
        }),
      }
    );

    const result = await fcmResponse.json();

    // If token is invalid, clear it
    if (result.error?.code === 404 || result.error?.code === 400) {
      await supabase
        .from('user_profiles')
        .update({ push_token: null })
        .eq('user_id', userId);
      console.log('Cleared invalid push token for user:', userId);
    }

    return new Response(
      JSON.stringify({ success: true, push: true, fcm: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
