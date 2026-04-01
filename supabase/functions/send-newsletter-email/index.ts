import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function sendViaResend(apiKey: string, from: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend error for ${to}:`, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`Resend send failed for ${to}:`, e);
    return false;
  }
}

function buildEmailHtml(body: string, name: string): string {
  const personalizedBody = body.replace(/\{name\}/g, name || 'there');
  const htmlBody = personalizedBody.replace(/\n/g, '<br/>');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:30px 40px;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">Afrinnect</h1>
        </td></tr>
        <tr><td style="padding:30px 40px;">
          <div style="font-size:15px;line-height:1.6;color:#333333;">${htmlBody}</div>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#999;margin:0;">
            You're receiving this because you're a member of Afrinnect.
            <a href="https://afrinnect-heartbeat.lovable.app/unsubscribe" style="color:#7c3aed;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@afrinnect.com';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some((r: any) => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { campaign_title, subject, body, target_audience } = await req.json();

    if (!subject || !body) {
      return new Response(JSON.stringify({ error: 'subject and body are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get target users based on audience
    let query = supabase.from('user_profiles').select('id, user_id, display_name, email');
    
    if (target_audience === 'premium') {
      query = query.in('subscription_tier', ['premium', 'elite', 'vip']);
    } else if (target_audience === 'founding_members') {
      query = query.eq('is_founding_member', true);
    } else if (target_audience === 'free') {
      query = query.or('subscription_tier.is.null,subscription_tier.eq.free');
    } else if (target_audience === 'inactive') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.lt('last_active', sevenDaysAgo);
    } else if (target_audience === 'new_users') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte('created_at', sevenDaysAgo);
    }

    const { data: users, error: queryError } = await query.limit(1000);
    if (queryError) throw queryError;

    const targeted = users?.length || 0;
    let emailsSent = 0;
    let emailsFailed = 0;

    // Send actual emails via Resend + in-app notifications
    if (users && users.length > 0) {
      // Send emails in batches with delay to respect rate limits
      for (const u of users) {
        if (u.email) {
          const html = buildEmailHtml(body, u.display_name || '');
          const personalizedSubject = subject.replace(/\{name\}/g, u.display_name || 'there');
          const sent = await sendViaResend(resendApiKey, emailFrom, u.email, personalizedSubject, html);
          if (sent) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
          // Small delay between sends (100ms) to avoid rate limits
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Also create in-app notifications
      const notifications = users.map((u: any) => ({
        user_profile_id: u.id,
        user_id: u.user_id,
        type: 'admin_message' as const,
        title: subject,
        message: body.substring(0, 500),
        is_admin: true,
      }));

      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        await supabase.from('notifications').insert(batch);
      }
    }

    // Audit log
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      action: 'newsletter_sent',
      target_type: 'campaign',
      target_id: campaign_title || subject,
      details: { subject, target_audience, targeted, emailsSent, emailsFailed },
    });

    return new Response(JSON.stringify({
      success: true,
      targeted,
      sent: emailsSent,
      failed: emailsFailed,
      message: `Campaign: ${emailsSent} emails sent, ${emailsFailed} failed, ${targeted} in-app notifications delivered`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
