// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRecentLogs } from '@/lib/structured-logger';
import { getSessionId } from '@/lib/correlation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, X, ChevronUp, ChevronDown, Copy } from 'lucide-react';

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('free');
  const [unreadCount, setUnreadCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [lastDeepLink, setLastDeepLink] = useState<string>('none');
  const [logs, setLogs] = useState<any[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id,subscription_tier,blocked_users')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile) {
          setProfileId(profile.id);
          setTier(profile.subscription_tier || 'free');
          setBlockedCount(Array.isArray(profile.blocked_users) ? profile.blocked_users.length : 0);

          const { count: unread } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_profile_id', profile.id)
            .eq('is_read', false);
          setUnreadCount(unread || 0);

          const { count: matches } = await supabase
            .from('matches')
            .select('id', { count: 'exact', head: true })
            .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
            .eq('is_match', true);
          setMatchCount(matches || 0);
        }
      } catch (e) {
        console.debug('Debug panel load error:', e);
      }

      setLogs(getRecentLogs().slice(-20).reverse());
      setLastDeepLink(sessionStorage.getItem('__last_deep_link') || 'none');
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [open]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-3 z-[9999] bg-primary text-primary-foreground rounded-full p-2 shadow-lg opacity-60 hover:opacity-100 transition-opacity"
        title="Debug Panel"
      >
        <Bug size={18} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-3 z-[9999] w-80 bg-card border border-border rounded-lg shadow-2xl text-xs font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted px-3 py-2 border-b border-border">
        <span className="font-semibold text-foreground flex items-center gap-1">
          <Bug size={14} /> Debug Panel
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(!minimized)} className="p-1 hover:bg-accent rounded">
            {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-accent rounded">
            <X size={14} />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="max-h-96 overflow-auto">
          {/* State Section */}
          <div className="p-3 space-y-2 border-b border-border">
            <h4 className="font-bold text-foreground mb-1">User State</h4>
            <Row label="Session" value={getSessionId().slice(0, 16) + '…'} onCopy={() => copyToClipboard(getSessionId())} />
            <Row label="User ID" value={userId?.slice(0, 12) + '…' || '—'} onCopy={() => userId && copyToClipboard(userId)} />
            <Row label="Profile ID" value={profileId?.slice(0, 12) + '…' || '—'} onCopy={() => profileId && copyToClipboard(profileId)} />
            <Row label="Tier" value={<Badge variant={tier === 'free' ? 'secondary' : 'default'} className="text-[10px] px-1 py-0">{tier}</Badge>} />
            <Row label="Matches" value={matchCount} />
            <Row label="Unread" value={<span className={unreadCount > 0 ? 'text-destructive font-bold' : ''}>{unreadCount}</span>} />
            <Row label="Blocked" value={blockedCount} />
            <Row label="Last Deep Link" value={lastDeepLink.length > 28 ? lastDeepLink.slice(0, 28) + '…' : lastDeepLink} />
          </div>

          {/* Recent Mutation Logs */}
          <div className="p-3">
            <h4 className="font-bold text-foreground mb-2">Recent Mutations ({logs.length})</h4>
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No mutations logged yet</p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <div key={i} className={`px-2 py-1 rounded text-[10px] ${
                      log.level === 'error' ? 'bg-destructive/10 text-destructive' :
                      log.level === 'warn' ? 'bg-yellow-500/10 text-yellow-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <span className="font-semibold">{log.action}</span>
                      <span className="ml-1 opacity-70">{log.correlation_id.slice(0, 16)}</span>
                      {log.duration_ms && <span className="ml-1">({log.duration_ms}ms)</span>}
                      {log.error && <div className="text-destructive mt-0.5">{log.error}</div>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: any; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground flex items-center gap-1">
        {value}
        {onCopy && (
          <button onClick={onCopy} className="p-0.5 hover:bg-accent rounded" title="Copy">
            <Copy size={10} />
          </button>
        )}
      </span>
    </div>
  );
}
