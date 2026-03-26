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
    if (!roles?.some((r: any) => r.role === 'admin')) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { type = 'charts', period = '7d' } = body;

    const now = new Date();
    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    if (type === 'charts') {
      // Fetch data for the period + previous period for comparison
      const [
        profilesRes, matchesRes, messagesRes, likesRes, subsRes
      ] = await Promise.all([
        supabase.from('user_profiles').select('id, gender, country_of_origin, subscription_tier, is_premium, is_founding_member, relationship_goal, created_at, last_active'),
        supabase.from('matches').select('id, created_at').eq('is_match', true).gte('created_at', prevStartDate.toISOString()),
        supabase.from('messages').select('id, created_at').gte('created_at', prevStartDate.toISOString()),
        supabase.from('likes').select('id, created_at').gte('created_at', prevStartDate.toISOString()),
        supabase.from('subscriptions').select('id, status, amount_paid, created_at').eq('status', 'active'),
      ]);

      const profiles = profilesRes.data || [];
      const matches = matchesRes.data || [];
      const messages = messagesRes.data || [];
      const likes = likesRes.data || [];
      const subs = subsRes.data || [];

      // Build daily chart data
      const dailyData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStr = date.toISOString().split('T')[0];
        
        dailyData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          signups: profiles.filter(p => p.created_at?.startsWith(dayStr)).length,
          matches: matches.filter(m => m.created_at?.startsWith(dayStr)).length,
          messages: messages.filter(m => m.created_at?.startsWith(dayStr)).length,
          likes: likes.filter(l => l.created_at?.startsWith(dayStr)).length,
          dau: profiles.filter(p => p.last_active?.startsWith(dayStr)).length,
        });
      }

      // Period metrics
      const periodProfiles = profiles.filter(p => new Date(p.created_at) >= startDate);
      const prevPeriodProfiles = profiles.filter(p => {
        const d = new Date(p.created_at);
        return d >= prevStartDate && d < startDate;
      });
      const periodMatches = matches.filter(m => new Date(m.created_at) >= startDate);
      const periodMessages = messages.filter(m => new Date(m.created_at) >= startDate);

      const signupGrowth = prevPeriodProfiles.length > 0
        ? ((periodProfiles.length - prevPeriodProfiles.length) / prevPeriodProfiles.length * 100).toFixed(1)
        : '0';

      // DAU/MAU
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const dau = profiles.filter(p => p.last_active && new Date(p.last_active) >= dayAgo).length;
      const mau = profiles.filter(p => p.last_active && new Date(p.last_active) >= monthAgo).length;

      // Demographics
      const genderDist: Record<string, number> = {};
      const countryDist: Record<string, number> = {};
      const tierDist: Record<string, number> = { free: 0, premium: 0, elite: 0, vip: 0 };
      const goalDist: Record<string, number> = {};

      profiles.forEach(p => {
        if (p.gender) genderDist[p.gender] = (genderDist[p.gender] || 0) + 1;
        if (p.country_of_origin) countryDist[p.country_of_origin] = (countryDist[p.country_of_origin] || 0) + 1;
        tierDist[p.subscription_tier || 'free'] = (tierDist[p.subscription_tier || 'free'] || 0) + 1;
        if (p.relationship_goal) goalDist[p.relationship_goal] = (goalDist[p.relationship_goal] || 0) + 1;
      });

      const topCountries = Object.entries(countryDist)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      const premiumUsers = profiles.filter(p => p.is_premium).length;
      const revenue = subs.reduce((sum, s) => sum + (s.amount_paid || 0), 0);

      return new Response(JSON.stringify({
        success: true,
        data: {
          dailyData,
          metrics: {
            totalUsers: profiles.length,
            newUsers: periodProfiles.length,
            signupGrowth: parseFloat(signupGrowth as string),
            totalMatches: periodMatches.length,
            totalMessages: periodMessages.length,
            dau, mau,
            dauMauRatio: mau > 0 ? ((dau / mau) * 100).toFixed(1) : '0',
            premiumUsers,
            conversionRate: profiles.length > 0 ? ((premiumUsers / profiles.length) * 100).toFixed(2) : '0',
            revenue,
          },
          demographics: {
            gender: Object.entries(genderDist).map(([name, value]) => ({ name, value })),
            countries: topCountries,
            tiers: Object.entries(tierDist).map(([name, value]) => ({ name, value })),
            goals: Object.entries(goalDist).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'users') {
      const { page = 1, pageSize = 20, search = '', status = 'all', tier = 'all', sort = '-created_at' } = body;
      
      let query = supabase.from('user_profiles').select('*', { count: 'exact' });

      // Search
      if (search) {
        query = query.or(`display_name.ilike.%${search}%,current_city.ilike.%${search}%,current_country.ilike.%${search}%`);
      }

      // Status filter
      if (status === 'active') query = query.eq('is_active', true).eq('is_banned', false);
      else if (status === 'banned') query = query.eq('is_banned', true);
      else if (status === 'suspended') query = query.eq('is_suspended', true);
      else if (status === 'inactive') query = query.eq('is_active', false);

      // Tier filter
      if (tier === 'premium') query = query.eq('is_premium', true);
      else if (tier === 'founding') query = query.eq('is_founding_member', true);
      else if (tier === 'free') query = query.or('is_premium.eq.false,is_premium.is.null');

      // Sort
      const ascending = !sort.startsWith('-');
      const sortField = sort.replace('-', '');
      query = query.order(sortField, { ascending });

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: users, count, error } = await query;
      if (error) throw error;

      // Get counts for stats cards
      const [totalRes, activeRes, premiumRes, bannedRes, verifiedRes] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_banned', false),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          users: users || [],
          totalCount: count || 0,
          stats: {
            totalUsers: totalRes.count || 0,
            activeUsers: activeRes.count || 0,
            premiumUsers: premiumRes.count || 0,
            bannedUsers: bannedRes.count || 0,
            verifiedUsers: verifiedRes.count || 0,
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'reports') {
      const { page = 1, pageSize = 20, status = 'all', reportType = 'all' } = body;

      let query = supabase.from('reports').select('*', { count: 'exact' });
      
      if (status !== 'all') query = query.eq('status', status);
      if (reportType !== 'all') query = query.eq('report_type', reportType);
      
      query = query.order('created_at', { ascending: false });
      
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data: reports, count, error } = await query;
      if (error) throw error;

      // Get counts per status
      const [pendingRes, reviewRes, resolvedRes, dismissedRes] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'dismissed'),
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          reports: reports || [],
          totalCount: count || 0,
          statusCounts: {
            pending: pendingRes.count || 0,
            under_review: reviewRes.count || 0,
            resolved: resolvedRes.count || 0,
            dismissed: dismissedRes.count || 0,
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'audit_logs') {
      const { page = 1, pageSize = 20, action = 'all', search = '' } = body;

      let query = supabase.from('admin_audit_logs').select('*', { count: 'exact' });

      if (action !== 'all') query = query.eq('action', action);
      if (search) {
        query = query.or(`admin_user_id.ilike.%${search}%,target_id.ilike.%${search}%`);
      }

      query = query.order('created_at', { ascending: false });

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data: logs, count, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        data: {
          logs: logs || [],
          totalCount: count || 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid type parameter' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
