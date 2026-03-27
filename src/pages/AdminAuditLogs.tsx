import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  ClipboardList, Search, ChevronLeft, ChevronRight, Download, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import AdminSidebar from "@/components/admin/AdminSidebar";

const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  ban: 'bg-red-500',
  permanent_ban: 'bg-red-600',
  unban: 'bg-green-500',
  suspend: 'bg-yellow-500',
  unsuspend: 'bg-green-400',
  verify: 'bg-blue-500',
  premium: 'bg-orange-500',
  founding: 'bg-yellow-400',
  report_resolved: 'bg-blue-400',
  warning: 'bg-amber-500',
};

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, searchQuery, actionFilter],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { 
          type: 'audit_logs', 
          page, 
          pageSize: PAGE_SIZE, 
          action: actionFilter, 
          search: searchQuery 
        }
      });
      if (error) throw error;
      return data?.data;
    },
    staleTime: 15000,
  });

  const logs = data?.logs || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Audit Logs</h1>
              <p className="text-sm text-slate-400">{totalCount} actions recorded</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search by admin or target ID..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="ban">Ban</SelectItem>
                    <SelectItem value="unban">Unban</SelectItem>
                    <SelectItem value="suspend">Suspend</SelectItem>
                    <SelectItem value="unsuspend">Unsuspend</SelectItem>
                    <SelectItem value="verify">Verify</SelectItem>
                    <SelectItem value="premium">Grant Premium</SelectItem>
                    <SelectItem value="founding">Grant Founding</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-slate-800 rounded" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No audit logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left p-4 text-slate-400 font-medium">Action</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Admin</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Target</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Details</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log: any) => (
                        <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="p-4">
                            <Badge className={`${actionColors[log.action] || 'bg-slate-500'} text-white`}>
                              {log.action?.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-slate-300 font-mono text-xs">
                              {log.admin_user_id?.slice(0, 12)}...
                            </span>
                          </td>
                          <td className="p-4">
                            <div>
                              <span className="text-white font-mono text-xs">
                                {log.target_id?.slice(0, 12)}...
                              </span>
                              {log.target_type && (
                                <span className="text-slate-500 text-xs ml-2">({log.target_type})</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {log.details && (
                              <span className="text-slate-400 text-xs max-w-[200px] truncate block">
                                {typeof log.details === 'object' 
                                  ? (log.details.reason || JSON.stringify(log.details).slice(0, 60)) 
                                  : String(log.details).slice(0, 60)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-slate-400 text-sm whitespace-nowrap">
                            {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && totalCount > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-800">
                  <p className="text-slate-400 text-sm">
                    Page {page} of {totalPages} ({totalCount} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="border-slate-700 text-slate-300">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="border-slate-700 text-slate-300">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
