// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Shield, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

type Status = 'untested' | 'pass' | 'fail' | 'blocked';

interface TestCase {
  id: string;
  priority: 'P0' | 'P1';
  category: string;
  scenario: string;
  preconditions: string;
  steps: string;
  expected: string;
  backendExpectation: string;
  status: Status;
  notes: string;
}

const INITIAL_CASES: TestCase[] = [
  // AUTH
  { id: 'AUTH-01', priority: 'P0', category: 'Auth', scenario: 'Email signup + email verification', preconditions: 'No existing account', steps: '1. Enter email/password\n2. Submit signup\n3. Check email\n4. Click verify link', expected: 'Account created, verification email sent, user can login after verify', backendExpectation: 'auth.users row created, profile NOT yet created', status: 'untested', notes: '' },
  { id: 'AUTH-02', priority: 'P0', category: 'Auth', scenario: 'Login with valid credentials', preconditions: 'Verified account exists', steps: '1. Enter email/password\n2. Submit login', expected: 'Redirect to /home, session persisted', backendExpectation: 'auth.sessions created, JWT issued', status: 'untested', notes: '' },
  { id: 'AUTH-03', priority: 'P0', category: 'Auth', scenario: 'Session restore on app reopen', preconditions: 'User logged in, close and reopen tab', steps: '1. Close browser tab\n2. Reopen app URL', expected: 'User lands on /home without login prompt', backendExpectation: 'Refresh token exchanged for new JWT', status: 'untested', notes: '' },
  { id: 'AUTH-04', priority: 'P1', category: 'Auth', scenario: 'Logout clears state', preconditions: 'User logged in', steps: '1. Go to Settings\n2. Tap Logout', expected: 'Redirect to landing, no cached user data', backendExpectation: 'Session revoked', status: 'untested', notes: '' },
  { id: 'AUTH-05', priority: 'P0', category: 'Auth', scenario: 'Banned user cannot access app', preconditions: 'User is_banned=true', steps: '1. Login with banned account', expected: 'Banned screen shown, no access to discovery', backendExpectation: 'RLS blocks all queries', status: 'untested', notes: '' },

  // ONBOARDING
  { id: 'ONB-01', priority: 'P0', category: 'Onboarding', scenario: 'Complete profile creation', preconditions: 'New verified user, no profile', steps: '1. Fill name, age, gender, country\n2. Upload photo\n3. Complete onboarding', expected: 'Profile created, redirect to /home', backendExpectation: 'user_profiles row inserted with user_id, createProfile edge function called', status: 'untested', notes: '' },
  { id: 'ONB-02', priority: 'P1', category: 'Onboarding', scenario: 'Incomplete profile blocked from discovery', preconditions: 'User with missing required fields', steps: '1. Try to access /home', expected: 'Redirect to onboarding or edit profile', backendExpectation: 'AuthGuard requireProfile check', status: 'untested', notes: '' },

  // DISCOVERY
  { id: 'DSC-01', priority: 'P0', category: 'Discovery', scenario: 'Discovery excludes liked/passed profiles', preconditions: 'User has liked and passed profiles', steps: '1. Open discovery\n2. Swipe through all profiles', expected: 'Never see already-liked or passed profiles', backendExpectation: 'discover-profiles excludes via DB + session set', status: 'untested', notes: '' },
  { id: 'DSC-02', priority: 'P0', category: 'Discovery', scenario: 'Discovery excludes blocked users', preconditions: 'User has blocked another user', steps: '1. Block user A\n2. Refresh discovery', expected: 'User A never appears', backendExpectation: 'blocked_users array checked server-side', status: 'untested', notes: '' },
  { id: 'DSC-03', priority: 'P0', category: 'Discovery', scenario: 'Discovery excludes own profile', preconditions: 'User with profile', steps: '1. Open discovery', expected: 'Own profile never shown', backendExpectation: 'neq filter on profile_id', status: 'untested', notes: '' },
  { id: 'DSC-04', priority: 'P1', category: 'Discovery', scenario: 'Discovery empty state', preconditions: 'No more profiles available', steps: '1. Swipe all profiles', expected: 'Clean empty state shown, not a crash', backendExpectation: 'Empty array returned', status: 'untested', notes: '' },

  // LIKE/PASS/MATCH
  { id: 'LPM-01', priority: 'P0', category: 'Likes & Matches', scenario: 'Like creates like record', preconditions: 'Discovery feed loaded', steps: '1. Swipe right on profile', expected: 'Card dismisses, like registered', backendExpectation: 'likes row inserted, daily_likes_count incremented', status: 'untested', notes: '' },
  { id: 'LPM-02', priority: 'P0', category: 'Likes & Matches', scenario: 'Mutual like creates atomic match', preconditions: 'User A likes User B who already liked A', steps: '1. User A swipes right on B', expected: 'Match celebration shown, match appears in list', backendExpectation: 'matches row inserted atomically, both users notified', status: 'untested', notes: '' },
  { id: 'LPM-03', priority: 'P0', category: 'Likes & Matches', scenario: 'Duplicate like is idempotent', preconditions: 'User already liked profile', steps: '1. Somehow trigger like again', expected: 'No error, no duplicate', backendExpectation: 'idx_likes_unique prevents duplicate, like-profile returns alreadyLiked', status: 'untested', notes: '' },
  { id: 'LPM-04', priority: 'P0', category: 'Likes & Matches', scenario: 'Daily like limit enforced', preconditions: 'Free user, 10 likes used today', steps: '1. Try to like 11th profile', expected: 'Paywall shown, like blocked', backendExpectation: 'like-profile returns 429 daily_limit_reached', status: 'untested', notes: '' },
  { id: 'LPM-05', priority: 'P1', category: 'Likes & Matches', scenario: 'Super like works', preconditions: 'Premium user', steps: '1. Tap super like button', expected: 'Super like sent, target notified with ⭐', backendExpectation: 'likes.is_super_like=true', status: 'untested', notes: '' },
  { id: 'LPM-06', priority: 'P1', category: 'Likes & Matches', scenario: 'Rewind undoes last action', preconditions: 'Premium user, just passed a profile', steps: '1. Tap rewind button', expected: 'Last profile reappears', backendExpectation: 'passes row deleted, session swiped ID removed', status: 'untested', notes: '' },
  { id: 'LPM-07', priority: 'P0', category: 'Likes & Matches', scenario: 'Pass prevents profile reappearing', preconditions: 'User passes on profile', steps: '1. Swipe left\n2. Refresh discovery', expected: 'Passed profile never shown again', backendExpectation: 'passes row inserted, excluded by discover-profiles', status: 'untested', notes: '' },

  // CHAT
  { id: 'CHT-01', priority: 'P0', category: 'Chat', scenario: 'Send text message', preconditions: 'Active match, chat open', steps: '1. Type message\n2. Tap send', expected: 'Message appears instantly (optimistic), confirmed by server', backendExpectation: 'messages row inserted via send-message edge function', status: 'untested', notes: '' },
  { id: 'CHT-02', priority: 'P0', category: 'Chat', scenario: 'Receive message in realtime', preconditions: 'Chat open, other user sends message', steps: '1. Other user sends message', expected: 'Message appears within 2 seconds without refresh', backendExpectation: 'Realtime postgres_changes delivers INSERT', status: 'untested', notes: '' },
  { id: 'CHT-03', priority: 'P0', category: 'Chat', scenario: 'Optimistic reconciliation by temp ID', preconditions: 'Chat open', steps: '1. Send message\n2. Observe optimistic → real swap', expected: 'No flash, no duplicate, smooth swap', backendExpectation: '__optimisticId matched to server response', status: 'untested', notes: '' },
  { id: 'CHT-04', priority: 'P1', category: 'Chat', scenario: 'Read receipts update', preconditions: 'Unread messages in chat', steps: '1. Open chat with unread messages', expected: 'Messages marked as read, badge decrements', backendExpectation: 'messages.is_read=true, notifications cleared', status: 'untested', notes: '' },

  // NOTIFICATIONS
  { id: 'NTF-01', priority: 'P0', category: 'Notifications', scenario: 'Deep link opens correct destination', preconditions: 'Match notification with link_to=/chat?matchId=X', steps: '1. Tap notification', expected: 'Navigates to correct chat', backendExpectation: 'link_to stored correctly in notifications table', status: 'untested', notes: '' },
  { id: 'NTF-02', priority: 'P1', category: 'Notifications', scenario: 'Auto-mark-read delayed', preconditions: 'Unread notifications exist', steps: '1. Open notifications page', expected: 'Notifications visible for 2s before marked read', backendExpectation: 'Batch update fires after 2s delay', status: 'untested', notes: '' },

  // BLOCK/REPORT
  { id: 'BLK-01', priority: 'P0', category: 'Safety', scenario: 'Block user removes from all surfaces', preconditions: 'User blocks another user', steps: '1. Block from chat menu\n2. Check matches, discovery, notifications', expected: 'Blocked user invisible everywhere', backendExpectation: 'blocked_users array updated, block-user edge function called', status: 'untested', notes: '' },
  { id: 'BLK-02', priority: 'P0', category: 'Safety', scenario: 'Report submits to moderation queue', preconditions: 'User reports another', steps: '1. Report from profile or chat\n2. Enter reason\n3. Submit', expected: 'Report confirmed, moderation queue entry', backendExpectation: 'reports row inserted via submit-report edge function', status: 'untested', notes: '' },

  // SUBSCRIPTION
  { id: 'SUB-01', priority: 'P0', category: 'Subscription', scenario: 'Free user cannot access premium features', preconditions: 'Free tier user', steps: '1. Try to use incognito mode\n2. Try to see who liked you', expected: 'TierGate blocks, paywall shown', backendExpectation: 'subscription_tier=free in user_profiles', status: 'untested', notes: '' },
  { id: 'SUB-02', priority: 'P0', category: 'Subscription', scenario: 'Tier upgrade reflected immediately', preconditions: 'User upgrades to premium', steps: '1. Complete purchase\n2. Check feature access', expected: 'Premium features unlocked instantly', backendExpectation: 'revenuecat-webhook updates subscription_tier', status: 'untested', notes: '' },

  // ACCOUNT STATE
  { id: 'ACT-01', priority: 'P0', category: 'Account', scenario: 'Suspended user sees suspension message', preconditions: 'User is_suspended=true', steps: '1. Open app', expected: 'Suspension screen shown with reason', backendExpectation: 'is_suspended checked on profile load', status: 'untested', notes: '' },
  { id: 'ACT-02', priority: 'P1', category: 'Account', scenario: 'Account deletion soft-deletes', preconditions: 'User requests deletion', steps: '1. Settings → Delete Account\n2. Confirm', expected: '30-day grace period starts', backendExpectation: 'deleted_accounts row, profile deactivated', status: 'untested', notes: '' },

  // RESILIENCE
  { id: 'RES-01', priority: 'P0', category: 'Resilience', scenario: 'Duplicate rapid taps on like', preconditions: 'Discovery card shown', steps: '1. Tap like 5 times quickly', expected: 'Only one like registered', backendExpectation: 'idx_likes_unique prevents duplicates', status: 'untested', notes: '' },
  { id: 'RES-02', priority: 'P1', category: 'Resilience', scenario: 'App refresh during send', preconditions: 'Chat open, message being sent', steps: '1. Send message\n2. Refresh page immediately', expected: 'Message either sent or not — no duplicates', backendExpectation: 'Idempotent insert or client retry safe', status: 'untested', notes: '' },

  // REALTIME
  { id: 'RT-01', priority: 'P0', category: 'Realtime', scenario: 'Match subscription uses server filter', preconditions: 'Matches page open', steps: '1. Another user pair creates a match', expected: 'Only own matches trigger refetch', backendExpectation: 'Realtime filter: user1_id=eq.X or user2_id=eq.X', status: 'untested', notes: '' },
];

const statusConfig: Record<Status, { label: string; color: string; icon: any }> = {
  untested: { label: 'Untested', color: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  pass: { label: 'PASS', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  fail: { label: 'FAIL', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  blocked: { label: 'Blocked', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle },
};

export default function AdminLaunchCertification() {
  const [cases, setCases] = useState<TestCase[]>(INITIAL_CASES);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const updateCase = (id: string, field: keyof TestCase, value: any) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const categories = [...new Set(cases.map(c => c.category))];

  const filtered = cases.filter(c => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    return true;
  });

  const stats = {
    total: cases.length,
    pass: cases.filter(c => c.status === 'pass').length,
    fail: cases.filter(c => c.status === 'fail').length,
    blocked: cases.filter(c => c.status === 'blocked').length,
    untested: cases.filter(c => c.status === 'untested').length,
    p0Total: cases.filter(c => c.priority === 'P0').length,
    p0Pass: cases.filter(c => c.priority === 'P0' && c.status === 'pass').length,
    p0Fail: cases.filter(c => c.priority === 'P0' && c.status === 'fail').length,
  };

  const isLaunchReady = stats.p0Fail === 0 && stats.p0Pass === stats.p0Total;

  const exportReport = () => {
    const lines = [
      '# Afrinnect Launch Certification Report',
      `Date: ${new Date().toISOString()}`,
      `Status: ${isLaunchReady ? '✅ LAUNCH READY' : '❌ NOT READY'}`,
      '',
      `## Summary`,
      `Total: ${stats.total} | Pass: ${stats.pass} | Fail: ${stats.fail} | Blocked: ${stats.blocked} | Untested: ${stats.untested}`,
      `P0: ${stats.p0Pass}/${stats.p0Total} passed`,
      '',
      '## Test Results',
      '',
      ...cases.map(c => `### ${c.id} [${c.priority}] ${c.scenario}\n- Status: ${c.status.toUpperCase()}\n- Category: ${c.category}\n- Notes: ${c.notes || '—'}\n`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launch-certification-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="outline" size="icon"><ArrowLeft size={16} /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="text-primary" /> Launch Certification
              </h1>
              <p className="text-muted-foreground text-sm">Track every P0/P1 scenario before go-live</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isLaunchReady ? 'default' : 'destructive'} className="text-sm px-3 py-1">
              {isLaunchReady ? '✅ LAUNCH READY' : '❌ NOT READY'}
            </Badge>
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download size={14} className="mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Pass" value={stats.pass} className="text-green-600" />
          <StatCard label="Fail" value={stats.fail} className="text-destructive" />
          <StatCard label="Blocked" value={stats.blocked} className="text-yellow-600" />
          <StatCard label="Untested" value={stats.untested} className="text-muted-foreground" />
        </div>

        {/* P0 Progress */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">P0 Progress</span>
              <span className="text-sm text-muted-foreground">{stats.p0Pass}/{stats.p0Total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${stats.p0Fail > 0 ? 'bg-destructive' : 'bg-green-500'}`}
                style={{ width: `${(stats.p0Pass / stats.p0Total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="P0">P0</SelectItem>
              <SelectItem value="P1">P1</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="untested">Untested</SelectItem>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Test Cases */}
        <div className="space-y-3">
          {filtered.map(tc => {
            const cfg = statusConfig[tc.status];
            const Icon = cfg.icon;
            return (
              <Card key={tc.id} className={`border-l-4 ${
                tc.status === 'pass' ? 'border-l-green-500' :
                tc.status === 'fail' ? 'border-l-destructive' :
                tc.status === 'blocked' ? 'border-l-yellow-500' :
                'border-l-muted'
              }`}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px]">{tc.id}</Badge>
                        <Badge variant={tc.priority === 'P0' ? 'destructive' : 'secondary'} className="text-[10px]">{tc.priority}</Badge>
                        <Badge variant="outline" className="text-[10px]">{tc.category}</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{tc.scenario}</h3>
                    </div>
                    <Select value={tc.status} onValueChange={(v) => updateCase(tc.id, 'status', v as Status)}>
                      <SelectTrigger className={`w-28 h-8 text-xs ${cfg.color}`}>
                        <Icon size={12} className="mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="untested">Untested</SelectItem>
                        <SelectItem value="pass">✅ Pass</SelectItem>
                        <SelectItem value="fail">❌ Fail</SelectItem>
                        <SelectItem value="blocked">⚠️ Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Preconditions</p>
                      <p className="text-foreground">{tc.preconditions}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Expected Result</p>
                      <p className="text-foreground">{tc.expected}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Steps</p>
                      <pre className="text-foreground whitespace-pre-wrap">{tc.steps}</pre>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Backend/State Expectation</p>
                      <p className="text-foreground">{tc.backendExpectation}</p>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Notes / evidence / failure details…"
                    value={tc.notes}
                    onChange={(e) => updateCase(tc.id, 'notes', e.target.value)}
                    className="text-xs min-h-[40px]"
                    rows={1}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, className = '' }: { label: string; value: number; className?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <div className={`text-2xl font-bold ${className}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
