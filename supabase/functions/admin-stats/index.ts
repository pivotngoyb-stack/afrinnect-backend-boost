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

    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    if (!roles?.some(r => r.role === 'admin')) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel data fetches
    const [
      profilesRes, matchesRes, reportsRes, subsRes,
      likesRes, messagesRes, ticketsRes, verificationsRes
    ] = await Promise.all([
      supabase.from('user_profiles').select('id, user_id, display_name, is_active, is_banned, is_suspended, is_premium, is_founding_member, is_verified, subscription_tier, created_at, last_active, login_streak', { count: 'exact' }),
      supabase.from('matches').select('id, is_match, created_at, matched_at', { count: 'exact' }).eq('is_match', true),
      supabase.from('reports').select('id, status, created_at', { count: 'exact' }),
      supabase.from('subscriptions').select('id, status, plan_type, amount_paid, currency, created_at, end_date', { count: 'exact' }),
      supabase.from('likes').select('id, created_at', { count: 'exact' }),
      supabase.from('messages').select('id, created_at', { count: 'exact' }),
      supabase.from('support_tickets').select('id, status, priority, created_at', { count: 'exact' }),
      supabase.from('verification_requests').select('id, status, created_at', { count: 'exact' }),
    ]);

    const profiles = profilesRes.data || [];
    const matches = matchesRes.data || [];
    const reports = reportsRes.data || [];
    const subscriptions = subsRes.data || [];
    const likes = likesRes.data || [];
    const messages = messagesRes.data || [];
    const tickets = ticketsRes.data || [];
    const verifications = verificationsRes.data || [];

    const activeProfiles = profiles.filter(p => p.is_active && !p.is_banned);
    const newUsersWeek = profiles.filter(p => new Date(p.created_at) >= weekAgo);
    const newUsersMonth = profiles.filter(p => new Date(p.created_at) >= monthAgo);
    const premiumUsers = profiles.filter(p => p.is_premium);
    const bannedUsers = profiles.filter(p => p.is_banned);
    const suspendedUsers = profiles.filter(p => p.is_suspended);
    const verifiedUsers = profiles.filter(p => p.is_verified);
    const foundingMembers = profiles.filter(p => p.is_founding_member);

    // Tier breakdown
    const goldUsers = profiles.filter(p => p.subscription_tier === 'gold').length;
    const platinumUsers = profiles.filter(p => p.subscription_tier === 'platinum').length;
    const diamondUsers = profiles.filter(p => p.subscription_tier === 'diamond').length;

    // DAU/MAU
    const dau = profiles.filter(p => p.last_active && new Date(p.last_active) >= new Date(now.getTime() - 24 * 60 * 60 * 1000)).length;
    const mau = profiles.filter(p => p.last_active && new Date(p.last_active) >= monthAgo).length;

    // Revenue
    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
    const revenueThisMonth = subscriptions
      .filter(s => new Date(s.created_at) >= monthAgo)
      .reduce((sum, s) => sum + (s.amount_paid || 0), 0);

    // Matches
    const matchesWeek = matches.filter(m => new Date(m.created_at) >= weekAgo);
    const matchesMonth = matches.filter(m => new Date(m.created_at) >= monthAgo);
    const usersWithMatches = new Set(matches.flatMap(m => [m.user1_id, m.user2_id].filter(Boolean))).size;

    // Reports
    const pendingReports = reports.filter(r => r.status === 'pending');
    
    // Tickets
    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'pending');
    const urgentTickets = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high');

    // Pending verifications
    const pendingVerifications = verifications.filter(v => v.status === 'pending');

    // Streaks
    const streak7Plus = profiles.filter(p => (p.login_streak || 0) >= 7).length;
    const streak30Plus = profiles.filter(p => (p.login_streak || 0) >= 30).length;
    const avgStreak = profiles.length > 0 
      ? Math.round(profiles.reduce((sum, p) => sum + (p.login_streak || 0), 0) / profiles.length) 
      : 0;

    // Previous month for growth rate
    const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const usersLastMonth = profiles.filter(p => {
      const d = new Date(p.created_at);
      return d >= twoMonthsAgo && d < monthAgo;
    }).length;
    const growthRate = usersLastMonth > 0 
      ? Math.round(((newUsersMonth.length - usersLastMonth) / usersLastMonth) * 100)
      : 0;

    const stats = {
      // Users
      totalProfiles: profiles.length,
      activeUsers: activeProfiles.length,
      newUsersThisWeek: newUsersWeek.length,
      newUsersThisMonth: newUsersMonth.length,
      premiumUsers: premiumUsers.length,
      eliteUsers: platinumUsers,
      vipUsers: diamondUsers,
      totalPaidUsers: premiumUsers.length,
      bannedUsers: bannedUsers.length,
      suspendedUsers: suspendedUsers.length,
      verifiedUsers: verifiedUsers.length,
      foundingMembers: foundingMembers.length,
      conversionRate: profiles.length > 0 ? ((premiumUsers.length / profiles.length) * 100).toFixed(1) : '0',
      
      // Engagement
      dau,
      mau,
      dauMauRatio: mau > 0 ? ((dau / mau) * 100).toFixed(1) : '0',
      avgStreak,
      streak7Plus,
      streak30Plus,
      growthRate,

      // Matches
      totalMatches: matches.length,
      matchesThisWeek: matchesWeek.length,
      matchesThisMonth: matchesMonth.length,
      matchRate: profiles.length > 0 ? ((usersWithMatches / profiles.length) * 100).toFixed(1) : '0',
      usersWithMatches,

      // Messages & Likes
      totalMessages: messagesRes.count || messages.length,
      totalLikes: likesRes.count || likes.length,

      // Revenue
      totalRevenue,
      revenueThisMonth,
      activeSubscriptions: activeSubs.length,

      // Moderation
      pendingReports: pendingReports.length,
      totalReports: reports.length,
      openTickets: openTickets.length,
      totalTickets: tickets.length,
      urgentTickets: urgentTickets.length,
      pendingVerifications: pendingVerifications.length,
    };

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
