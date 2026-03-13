// @ts-nocheck
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Users, Heart, Activity } from 'lucide-react';

export default function RobustAnalyticsDashboard() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['analytics-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles').select('id, subscription_tier, has_matched_before, photos, created_at');
      return data || [];
    }
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['analytics-subscriptions'],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('*').eq('status', 'active');
      return data || [];
    }
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['analytics-matches'],
    queryFn: async () => {
      const { data } = await supabase.from('matches').select('id, created_at').eq('is_match', true);
      return data || [];
    }
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['analytics-messages'],
    queryFn: async () => {
      const { data } = await supabase.from('messages').select('id, created_at');
      return data || [];
    }
  });

  const { data: likes = [] } = useQuery({
    queryKey: ['analytics-likes'],
    queryFn: async () => {
      const { data } = await supabase.from('likes').select('id, created_at');
      return data || [];
    }
  });

  // Activity over last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(); date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const activityByDay = last30Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    likes: likes.filter(l => l.created_at?.startsWith(date)).length,
    matches: matches.filter(m => m.created_at?.startsWith(date)).length,
    messages: messages.filter(m => m.created_at?.startsWith(date)).length
  }));

  // Conversion funnel
  const funnelData = [
    { stage: 'Signups', count: profiles.length, percentage: 100 },
    { stage: 'Profile Complete', count: profiles.filter(p => p.photos?.length >= 3).length, percentage: profiles.length ? ((profiles.filter(p => p.photos?.length >= 3).length / profiles.length) * 100).toFixed(1) : 0 },
    { stage: 'First Match', count: profiles.filter(p => p.has_matched_before).length, percentage: profiles.length ? ((profiles.filter(p => p.has_matched_before).length / profiles.length) * 100).toFixed(1) : 0 },
    { stage: 'Premium', count: subscriptions.length, percentage: profiles.length ? ((subscriptions.length / profiles.length) * 100).toFixed(1) : 0 }
  ];

  const tierDistribution = [
    { name: 'Free', value: profiles.filter(p => !p.subscription_tier || p.subscription_tier === 'free').length },
    { name: 'Premium', value: profiles.filter(p => p.subscription_tier === 'premium').length },
    { name: 'Elite', value: profiles.filter(p => p.subscription_tier === 'elite').length },
    { name: 'VIP', value: profiles.filter(p => p.subscription_tier === 'vip').length }
  ];

  const COLORS = ['hsl(var(--muted-foreground))', 'hsl(var(--primary))', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{profiles.length}</p></div><Users size={32} className="text-primary" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Likes</p><p className="text-2xl font-bold">{likes.length}</p></div><Activity size={32} className="text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Matches</p><p className="text-2xl font-bold">{matches.length}</p></div><Heart size={32} className="text-pink-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Messages</p><p className="text-2xl font-bold">{messages.length}</p></div><TrendingUp size={32} className="text-green-600" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>User Activity (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="likes" stroke="#ec4899" name="Likes" />
              <Line type="monotone" dataKey="matches" stroke="#10b981" name="Matches" />
              <Line type="monotone" dataKey="messages" stroke="#3b82f6" name="Messages" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Conversion Funnel</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))">
                  {funnelData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {funnelData.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm"><span>{item.stage}</span><span className="font-medium">{item.percentage}%</span></div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subscription Tiers</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={tierDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} dataKey="value">
                  {tierDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
