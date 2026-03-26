// @ts-nocheck
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Users, Heart, Shield, TrendingUp, AlertTriangle,
  BarChart3, DollarSign, Activity, Flag, ChevronRight, 
  RefreshCw, Search, Bell, Menu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface DashboardStats {
  totalProfiles: number;
  activeUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  premiumUsers: number;
  bannedUsers: number;
  suspendedUsers: number;
  dau: number;
  mau: number;
  dauMauRatio: string;
  totalMatches: number;
  matchesThisWeek: number;
  totalMessages: number;
  totalLikes: number;
  activeSubscriptions: number;
  totalRevenue: number;
  conversionRate: string;
  pendingReports: number;
  urgentTickets: number;
  pendingVerifications: number;
}

interface ActivityItem {
  type: 'signup' | 'report';
  user?: string;
  reportType?: string;
  time: string;
}

// Static color maps for quick actions (avoids dynamic Tailwind)
const quickActionStyles: Record<string, { bg: string; icon: string }> = {
  red:    { bg: 'bg-red-500/20',    icon: 'text-red-400' },
  blue:   { bg: 'bg-blue-500/20',   icon: 'text-blue-400' },
  green:  { bg: 'bg-green-500/20',  icon: 'text-green-400' },
  slate:  { bg: 'bg-slate-500/20',  icon: 'text-slate-400' },
  purple: { bg: 'bg-purple-500/20', icon: 'text-purple-400' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<Array<{ type: string; message: string; icon: React.ElementType }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { navigate('/home'); return; }
      
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', authUser.id);
      const isAdmin = roles?.some((r: { role: string }) => r.role === 'admin');
      if (!isAdmin) { navigate('/home'); return; }
      
      await loadDashboardData();
    } catch {
      navigate('/home');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-stats');
      
      if (error) throw error;
      if (data?.stats) {
        setStats(data.stats);
        
        const newAlerts: typeof alerts = [];
        if (data.stats.pendingReports > 10) {
          newAlerts.push({ type: 'danger', message: `${data.stats.pendingReports} pending reports need attention`, icon: AlertTriangle });
        }
        if (data.stats.urgentTickets > 5) {
          newAlerts.push({ type: 'warning', message: `${data.stats.urgentTickets} urgent support tickets`, icon: AlertTriangle });
        }
        if (data.stats.pendingVerifications > 0) {
          newAlerts.push({ type: 'info', message: `${data.stats.pendingVerifications} pending verifications`, icon: Shield });
        }
        setAlerts(newAlerts);
      }
      
      const [recentSignups, recentReports] = await Promise.all([
        supabase.from('user_profiles').select('display_name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('reports').select('reason, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const activities: ActivityItem[] = [
        ...(recentSignups.data || []).map(u => ({ type: 'signup' as const, user: u.display_name, time: u.created_at! })),
        ...(recentReports.data || []).map(r => ({ type: 'report' as const, reportType: r.reason, time: r.created_at! })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
      setStats({} as DashboardStats);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    toast.success('Dashboard refreshed');
    setRefreshing(false);
  };

  const quickActions = [
    { label: 'Review Reports', icon: Flag, page: '/adminmoderation', badge: stats?.pendingReports, color: 'red' },
    { label: 'Manage Users', icon: Users, page: '/adminusers', color: 'blue' },
    { label: 'View Analytics', icon: TrendingUp, page: '/adminanalytics', color: 'green' },
    { label: 'System Settings', icon: BarChart3, page: '/adminsettings', color: 'slate' },
    { label: 'Send Broadcast', icon: Bell, page: '/adminbroadcast', color: 'purple' },
  ];

  const secondaryMetrics = [
    { label: 'Total Matches', value: stats?.totalMatches || 0, sub: `+${stats?.matchesThisWeek || 0} this week`, colorClass: 'text-pink-400' },
    { label: 'Messages', value: stats?.totalMessages || 0, sub: 'All time', colorClass: 'text-purple-400' },
    { label: 'Total Likes', value: stats?.totalLikes || 0, sub: 'All time', colorClass: 'text-red-400' },
    { label: 'Active Subs', value: stats?.activeSubscriptions || 0, sub: `$${(stats?.totalRevenue || 0).toFixed(0)} revenue`, colorClass: 'text-green-400' },
    { label: 'Banned', value: stats?.bannedUsers || 0, sub: 'Permanent', colorClass: 'text-slate-400' },
    { label: 'Suspended', value: stats?.suspendedUsers || 0, sub: 'Temporary', colorClass: 'text-yellow-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar pendingReports={stats?.pendingReports} />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard Overview</h1>
              <p className="text-sm text-slate-400">Platform health at a glance</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search users..." 
                  className="w-64 pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                      navigate(`/adminusers?search=${encodeURIComponent((e.target as HTMLInputElement).value)}`);
                    }
                  }}
                />
              </div>
              <Button onClick={handleRefresh} disabled={refreshing} className="bg-orange-500 hover:bg-orange-600">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {alerts.map((alert, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-lg ${
                  alert.type === 'danger' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                  alert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                }`}>
                  <alert.icon className="w-5 h-5" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Key Metrics */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 bg-slate-700 mb-2" />
                    <Skeleton className="h-8 w-16 bg-slate-700 mb-1" />
                    <Skeleton className="h-3 w-24 bg-slate-700" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalProfiles?.toLocaleString() || 0}</p>
                      <p className="text-green-400 text-xs">+{stats?.newUsersThisWeek || 0} this week</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">DAU / MAU</p>
                      <p className="text-2xl font-bold text-white">{stats?.dau || 0} / {stats?.mau || 0}</p>
                      <p className="text-slate-400 text-xs">{stats?.dauMauRatio || 0}% ratio</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Premium Users</p>
                      <p className="text-2xl font-bold text-white">{stats?.premiumUsers || 0}</p>
                      <p className="text-orange-400 text-xs">{stats?.conversionRate || 0}% conversion</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Pending Reports</p>
                      <p className="text-2xl font-bold text-white">{stats?.pendingReports || 0}</p>
                      <p className="text-red-400 text-xs">Needs review</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Flag className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            {secondaryMetrics.map((metric, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-xs">{metric.label}</p>
                  <p className="text-xl font-bold text-white">{metric.value?.toLocaleString()}</p>
                  <p className={`${metric.colorClass} text-xs`}>{metric.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions & Activity */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, i) => {
                  const style = quickActionStyles[action.color] || quickActionStyles.slate;
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(action.page)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center`}>
                        <action.icon className={`w-4 h-4 ${style.icon}`} />
                      </div>
                      <span className="text-white flex-1 text-left">{action.label}</span>
                      {(action.badge ?? 0) > 0 && (
                        <Badge className="bg-red-500 text-white">{action.badge}</Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'signup' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {activity.type === 'signup' 
                            ? <Users className="w-5 h-5 text-green-400" />
                            : <Flag className="w-5 h-5 text-red-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            {activity.type === 'signup' 
                              ? `${activity.user || 'New user'} signed up`
                              : `New report: ${activity.reportType}`}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(activity.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <p className="text-slate-500 text-center py-8">No recent activity</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
