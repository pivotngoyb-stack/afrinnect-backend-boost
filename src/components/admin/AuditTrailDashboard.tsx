import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { countRecords, filterRecords } from '@/lib/supabase-helpers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock, User, Shield, Activity } from 'lucide-react';
import moment from 'moment';

export default function AuditTrailDashboard() {
  const [filters, setFilters] = useState({
    eventType: 'all',
    severity: 'all',
    dateRange: '7d',
    search: ''
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Fetch audit events from multiple sources
  const { data: auditEvents = [], isLoading } = useQuery({
    queryKey: ['audit-trail', filters, page],
    queryFn: async () => {
      const events = [];
      
      // Calculate date filter
      const dateFilter = {
        '24h': new Date(Date.now() - 86400000).toISOString(),
        '7d': new Date(Date.now() - 7 * 86400000).toISOString(),
        '30d': new Date(Date.now() - 30 * 86400000).toISOString(),
        'all': null
      }[filters.dateRange];
      
      const dateQuery = dateFilter ? { created_date: { $gte: dateFilter } } : {};

      // Fetch from ProfileAnalytics
      const analytics = await filterRecords('profile_analytics', 
        { ...dateQuery },
        '-timestamp',
        pageSize
      );
      
      events.push(...analytics.map(a => ({
        id: a.id,
        type: 'analytics',
        event_type: a.event_type,
        user_id: a.user_profile_id,
        timestamp: a.timestamp || a.created_date,
        data: a.event_data,
        severity: 'info',
        source: 'ProfileAnalytics'
      })));

      // Fetch from AdminAuditLog
      const auditLogs = await filterRecords('admin_audit_logs', 
        { ...dateQuery },
        '-created_date',
        pageSize
      );
      
      events.push(...auditLogs.map(a => ({
        id: a.id,
        type: 'admin_action',
        event_type: a.action_type,
        user_id: a.admin_id,
        target_id: a.target_id,
        timestamp: a.created_date,
        data: { description: a.description, before: a.before_state, after: a.after_state },
        severity: a.action_type?.includes('ban') || a.action_type?.includes('delete') ? 'high' : 'medium',
        source: 'AdminAuditLog'
      })));

      // Fetch from ErrorLog
      const errorLogs = await filterRecords('error_logs', 
        { ...dateQuery },
        '-created_date',
        pageSize
      );
      
      events.push(...errorLogs.map(e => ({
        id: e.id,
        type: 'error',
        event_type: e.type,
        user_id: e.user_id,
        timestamp: e.created_date,
        data: { message: e.message, url: e.url, breadcrumbs: e.breadcrumbs },
        severity: e.severity || 'high',
        source: 'ErrorLog'
      })));

      // Fetch from ModerationAction
      const modActions = await filterRecords('moderation_actions', 
        { ...dateQuery },
        '-created_date',
        pageSize
      );
      
      events.push(...modActions.map(m => ({
        id: m.id,
        type: 'moderation',
        event_type: m.action_type,
        user_id: m.moderator_id,
        target_id: m.target_user_id,
        timestamp: m.created_date,
        data: { reason: m.reason, duration: m.duration },
        severity: m.action_type === 'ban' ? 'critical' : 'high',
        source: 'ModerationAction'
      })));

      // Sort all events by timestamp
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply filters
      let filtered = events;
      
      if (filters.eventType !== 'all') {
        filtered = filtered.filter(e => e.type === filters.eventType);
      }
      
      if (filters.severity !== 'all') {
        filtered = filtered.filter(e => e.severity === filters.severity);
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(e => 
          e.event_type?.toLowerCase().includes(search) ||
          e.user_id?.toLowerCase().includes(search) ||
          e.target_id?.toLowerCase().includes(search) ||
          JSON.stringify(e.data).toLowerCase().includes(search)
        );
      }

      return filtered.slice(0, pageSize);
    },
    refetchInterval: 30000
  });

  // Summary stats
  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const last24h = new Date(Date.now() - 86400000).toISOString();
      
      const [errorCount, modCount, analyticsCount] = await Promise.all([
        countRecords('error_logs', { created_date: { $gte: last24h } }),
        countRecords('moderation_actions', { created_date: { $gte: last24h } }),
        countRecords('profile_analytics', { date: new Date().toISOString().split('T')[0] })
      ]);

      return { errors: errorCount, moderation: modCount, analytics: analyticsCount };
    }
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-white';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'admin_action': return <Shield className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'moderation': return <User className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const exportAuditLog = () => {
    const csv = [
      ['Timestamp', 'Type', 'Event', 'User ID', 'Target ID', 'Severity', 'Source', 'Data'].join(','),
      ...auditEvents.map(e => [
        e.timestamp,
        e.type,
        e.event_type,
        e.user_id || '',
        e.target_id || '',
        e.severity,
        e.source,
        JSON.stringify(e.data).replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Audit Trail</h2>
          <p className="text-muted-foreground">Centralized view of all system events and actions</p>
        </div>
        <Button onClick={exportAuditLog} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-secondary border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.errors || 0}</p>
                <p className="text-sm text-muted-foreground">Errors (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.moderation || 0}</p>
                <p className="text-sm text-muted-foreground">Mod Actions (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.analytics || 0}</p>
                <p className="text-sm text-muted-foreground">Events (Today)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{auditEvents.length}</p>
                <p className="text-sm text-muted-foreground">Displayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-secondary border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 bg-secondary border-border text-white"
                />
              </div>
            </div>
            
            <Select value={filters.eventType} onValueChange={(v) => setFilters({ ...filters, eventType: v })}>
              <SelectTrigger className="w-[150px] bg-secondary border-border text-white">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="admin_action">Admin Actions</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="moderation">Moderation</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.severity} onValueChange={(v) => setFilters({ ...filters, severity: v })}>
              <SelectTrigger className="w-[150px] bg-secondary border-border text-white">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.dateRange} onValueChange={(v) => setFilters({ ...filters, dateRange: v })}>
              <SelectTrigger className="w-[150px] bg-secondary border-border text-white">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white">Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Time</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Event</TableHead>
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-muted-foreground">Source</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : auditEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditEvents.map((event) => (
                    <TableRow key={`${event.source}-${event.id}`} className="border-border hover:bg-secondary/50">
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {moment(event.timestamp).format('MMM D HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {getTypeIcon(event.type)}
                          {event.type}
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {event.event_type}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {event.user_id?.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {event.source}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                          className="text-muted-foreground hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="bg-secondary border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="text-white">{moment(selectedEvent.timestamp).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event Type</p>
                  <p className="text-white">{selectedEvent.event_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="text-white font-mono text-sm">{selectedEvent.user_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target ID</p>
                  <p className="text-white font-mono text-sm">{selectedEvent.target_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  <Badge className={getSeverityColor(selectedEvent.severity)}>{selectedEvent.severity}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="text-white">{selectedEvent.source}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Event Data</p>
                <pre className="bg-background p-4 rounded-lg text-sm text-muted-foreground overflow-auto max-h-[300px]">
                  {JSON.stringify(selectedEvent.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}