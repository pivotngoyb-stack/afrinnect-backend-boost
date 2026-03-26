import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, Users, Heart, MessageSquare, DollarSign, 
  Calendar, Download, ArrowUp, ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import AdminSidebar from "@/components/admin/AdminSidebar";

const COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7d");

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics-server', period],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { type: 'charts', period }
      });
      if (error) throw error;
      return data?.data;
    },
    staleTime: 60000,
    retry: 1,
  });

  const metrics = data?.metrics;
  const chartData = data?.dailyData || [];
  const demographics = data?.demographics;

  const handleExport = () => {
    const csv = [
      ['Date', 'Signups', 'DAU', 'Matches', 'Likes', 'Messages'].join(','),
      ...chartData.map((d: any) => [d.date, d.signups, d.dau, d.matches, d.likes, d.messages].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Analytics</h1>
              <p className="text-sm text-slate-400">Server-aggregated platform metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <Card key={i} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 bg-slate-700 mb-2" />
                    <Skeleton className="h-8 w-16 bg-slate-700" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-white">{metrics?.totalUsers?.toLocaleString()}</p>
                      <div className="flex items-center gap-1 text-sm">
                        {(metrics?.signupGrowth ?? 0) >= 0 ? (
                          <ArrowUp className="w-3 h-3 text-green-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-red-400" />
                        )}
                        <span className={(metrics?.signupGrowth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {Math.abs(metrics?.signupGrowth ?? 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm">DAU / MAU</p>
                  <p className="text-2xl font-bold text-white">{metrics?.dau} / {metrics?.mau}</p>
                  <p className="text-green-400 text-sm">{metrics?.dauMauRatio}% stickiness</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white">{metrics?.conversionRate}%</p>
                  <p className="text-orange-400 text-sm">{metrics?.premiumUsers} premium</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-white">${metrics?.revenue?.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">All time</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white">User Growth</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="signups" stroke="#f97316" fill="url(#signupGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white">Daily Engagement</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="dau" name="DAU" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="matches" name="Matches" stroke="#ec4899" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="likes" name="Likes" stroke="#f97316" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Demographics */}
          {demographics && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle className="text-white">Top Countries</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={demographics.countries} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                      <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle className="text-white">Subscription Tiers</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={demographics.tiers}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={80}
                        paddingAngle={5} dataKey="value"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {demographics.tiers.map((_: any, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <p className="text-red-400">Failed to load analytics: {(error as Error).message}</p>
                <Button variant="outline" className="mt-2 text-red-400 border-red-500/30" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
