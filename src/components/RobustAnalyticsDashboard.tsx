import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Users, Heart, Activity } from "lucide-react";

// TODO: Replace with Supabase queries once Cloud is enabled
const fetchAnalytics = async () => [] as any[];
const fetchProfiles = async () => [] as any[];
const fetchSubscriptions = async () => [] as any[];

export default function RobustAnalyticsDashboard() {
  const { data: analytics = [] } = useQuery({
    queryKey: ["robust-analytics"],
    queryFn: fetchAnalytics,
    refetchInterval: 60000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["analytics-profiles"],
    queryFn: fetchProfiles,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["analytics-subscriptions"],
    queryFn: fetchSubscriptions,
  });

  const eventsByType = analytics.reduce((acc: Record<string, number>, item: any) => {
    if (item.event_type) {
      acc[item.event_type] = (acc[item.event_type] || 0) + 1;
    }
    return acc;
  }, {});

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split("T")[0];
  });

  const activityByDay = last30Days.map((date) => {
    const dayAnalytics = analytics.filter((a: any) => a.created_date?.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views: dayAnalytics.filter((a: any) => a.event_type?.includes("view")).length,
      likes: dayAnalytics.filter((a: any) => a.event_type?.includes("like")).length,
      matches: dayAnalytics.filter((a: any) => a.event_type?.includes("match")).length,
      messages: dayAnalytics.filter((a: any) => a.event_type?.includes("message")).length,
    };
  });

  const funnelData = [
    { stage: "Signups", count: profiles.length, percentage: 100 },
    {
      stage: "Profile Complete",
      count: profiles.filter((p: any) => p.photos?.length >= 3).length,
      percentage: ((profiles.filter((p: any) => p.photos?.length >= 3).length / (profiles.length || 1)) * 100).toFixed(1),
    },
    {
      stage: "First Match",
      count: profiles.filter((p: any) => p.has_matched_before).length,
      percentage: ((profiles.filter((p: any) => p.has_matched_before).length / (profiles.length || 1)) * 100).toFixed(1),
    },
    {
      stage: "Premium",
      count: subscriptions.length,
      percentage: ((subscriptions.length / (profiles.length || 1)) * 100).toFixed(1),
    },
  ];

  const tierDistribution = [
    { name: "Free", value: profiles.filter((p: any) => !p.subscription_tier || p.subscription_tier === "free").length },
    { name: "Premium", value: profiles.filter((p: any) => p.subscription_tier === "premium").length },
    { name: "Elite", value: profiles.filter((p: any) => p.subscription_tier === "elite").length },
    { name: "VIP", value: profiles.filter((p: any) => p.subscription_tier === "vip").length },
  ];

  const COLORS = ["hsl(var(--muted-foreground))", "hsl(var(--primary))", "hsl(40, 96%, 53%)", "hsl(var(--destructive))"];

  const topEvents = Object.entries(eventsByType)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([event, count]) => ({ event, count }));

  const totalViews = analytics.filter((a: any) => a.event_type?.includes("view")).length;
  const totalMatches = analytics.filter((a: any) => a.event_type?.includes("match")).length;
  const totalMessages = analytics.filter((a: any) => a.event_type?.includes("message")).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
              <Users size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profile Views</p>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
              <Activity size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matches</p>
                <p className="text-2xl font-bold">{totalMatches}</p>
              </div>
              <Heart size={32} className="text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{totalMessages}</p>
              </div>
              <TrendingUp size={32} className="text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="Views" />
              <Line type="monotone" dataKey="likes" stroke="hsl(var(--destructive))" name="Likes" />
              <Line type="monotone" dataKey="matches" stroke="hsl(142, 76%, 36%)" name="Matches" />
              <Line type="monotone" dataKey="messages" stroke="hsl(217, 91%, 60%)" name="Messages" />
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
                  {funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {funnelData.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.stage}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subscription Tiers</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {tierDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topEvents.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm">{item.event}</span>
                <span className="font-semibold">{item.count as React.ReactNode}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
