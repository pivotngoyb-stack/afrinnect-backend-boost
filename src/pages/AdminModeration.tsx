// @ts-nocheck
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, AlertTriangle, Flag, Eye, Ban, Check, X, Clock,
  MessageSquare, RefreshCw, ChevronLeft, ChevronRight, User,
  CheckSquare, Square, EyeOff, History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/AdminSidebar";

const PAGE_SIZE = 20;

// Types
interface Report {
  id: string;
  reason: string;
  description: string | null;
  status: string | null;
  reported_id: string;
  reported_user_id: string;
  reporter_id: string;
  reporter_user_id: string;
  evidence_urls: string[] | null;
  resolution: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  primary_photo: string | null;
  is_banned: boolean | null;
  is_suspended: boolean | null;
  violation_count: number | null;
  warning_count: number | null;
}

const REPORT_TYPE_STYLES: Record<string, string> = {
  fake_profile: "bg-purple-500 text-white",
  harassment: "bg-red-500 text-white",
  inappropriate_content: "bg-orange-500 text-white",
  scam: "bg-red-600 text-white",
  underage: "bg-red-700 text-white",
  spam: "bg-yellow-500 text-white",
  hate_speech: "bg-red-500 text-white",
  other: "bg-muted text-muted-foreground",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  under_review: "bg-blue-500 text-white",
  resolved: "bg-green-500 text-white",
  dismissed: "bg-muted text-muted-foreground",
};

export default function AdminModeration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [blurEvidence, setBlurEvidence] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; label: string }>({
    open: false, action: "", label: ""
  });

  // Fetch current admin user
  const { data: currentUser } = useQuery({
    queryKey: ["admin-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const isAdmin = roles?.some(r => r.role === "admin");
      if (!isAdmin) throw new Error("Not admin");
      return { id: user.id, email: user.email };
    },
    retry: false,
    meta: { onError: () => navigate("/") }
  });

  // Server-side paginated reports
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ["admin-reports", statusFilter, typeFilter, page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let countQuery = supabase.from("reports").select("*", { count: "exact", head: true });
      let dataQuery = supabase.from("reports").select("*").order("created_at", { ascending: false }).range(from, to);

      if (statusFilter !== "all") {
        countQuery = countQuery.eq("status", statusFilter);
        dataQuery = dataQuery.eq("status", statusFilter);
      }
      if (typeFilter !== "all") {
        countQuery = countQuery.eq("reason", typeFilter);
        dataQuery = dataQuery.eq("reason", typeFilter);
      }

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (error) throw error;
      return { reports: (data || []) as Report[], total: count || 0 };
    },
    enabled: !!currentUser,
  });

  // Fetch status counts
  const { data: statusCounts } = useQuery({
    queryKey: ["admin-report-counts"],
    queryFn: async () => {
      const statuses = ["pending", "under_review", "resolved", "dismissed"];
      const results = await Promise.all(
        statuses.map(s => supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", s))
      );
      return {
        pending: results[0].count || 0,
        under_review: results[1].count || 0,
        resolved: results[2].count || 0,
        dismissed: results[3].count || 0,
        total: (results[0].count || 0) + (results[1].count || 0) + (results[2].count || 0) + (results[3].count || 0),
      };
    },
    enabled: !!currentUser,
    staleTime: 30000,
  });

  // Fetch profiles for selected report (side-by-side)
  const { data: reportProfiles } = useQuery({
    queryKey: ["report-profiles", selectedReport?.id],
    queryFn: async () => {
      if (!selectedReport) return null;
      const [{ data: reported }, { data: reporter }] = await Promise.all([
        supabase.from("user_profiles").select("id, user_id, display_name, primary_photo, is_banned, is_suspended, violation_count, warning_count").eq("id", selectedReport.reported_id).maybeSingle(),
        supabase.from("user_profiles").select("id, user_id, display_name, primary_photo, is_banned, is_suspended, violation_count, warning_count").eq("id", selectedReport.reporter_id).maybeSingle(),
      ]);
      return {
        reported: reported as UserProfile | null,
        reporter: reporter as UserProfile | null,
      };
    },
    enabled: !!selectedReport,
  });

  // Resolve single report mutation
  const resolveReport = useMutation({
    mutationFn: async ({ reportId, action, notes }: { reportId: string; action: string; notes: string }) => {
      if (!currentUser) throw new Error("Not authenticated");

      const status = action === "dismiss" ? "dismissed" : "resolved";
      const { error } = await supabase.from("reports").update({
        status,
        resolution: action,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", reportId);
      if (error) throw error;

      // Log audit
      await supabase.from("admin_audit_logs").insert({
        admin_user_id: currentUser.id,
        action: `report_${action}`,
        target_type: "report",
        target_id: reportId,
        details: { notes, action } as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-report-counts"] });
      setSelectedReport(null);
      setModeratorNotes("");
      toast({ title: "Report resolved", description: "Action recorded in audit log." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Bulk resolve mutation
  const bulkResolve = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      if (!currentUser) throw new Error("Not authenticated");
      const status = action === "dismiss" ? "dismissed" : "resolved";

      const { error } = await supabase.from("reports").update({
        status,
        resolution: action,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      }).in("id", ids);
      if (error) throw error;

      // Audit log for bulk action
      await supabase.from("admin_audit_logs").insert({
        admin_user_id: currentUser.id,
        action: `bulk_report_${action}`,
        target_type: "report",
        target_id: ids.join(","),
        details: { count: ids.length, action } as any,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-report-counts"] });
      setSelectedIds(new Set());
      toast({ title: `${vars.ids.length} reports updated`, description: `Action: ${vars.action}` });
    },
    onError: (e: Error) => {
      toast({ title: "Bulk action failed", description: e.message, variant: "destructive" });
    },
  });

  const reports = reportsData?.reports || [];
  const totalReports = reportsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalReports / PAGE_SIZE));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map(r => r.id)));
    }
  };

  const handleSingleAction = (action: string, label: string) => {
    if (action === "permanent_ban") {
      setConfirmDialog({ open: true, action, label });
    } else {
      resolveReport.mutate({ reportId: selectedReport!.id, action, notes: moderatorNotes });
    }
  };

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
  };

  const confirmBulk = () => {
    if (bulkAction && selectedIds.size > 0) {
      bulkResolve.mutate({ ids: Array.from(selectedIds), action: bulkAction });
      setBulkAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar pendingReports={statusCounts?.pending || 0} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Content Moderation</h1>
              <p className="text-sm text-muted-foreground">
                {statusCounts?.pending || 0} reports pending review
              </p>
            </div>
            <Button onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
              queryClient.invalidateQueries({ queryKey: ["admin-report-counts"] });
            }} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pending", value: statusCounts?.pending, icon: Clock, color: "text-yellow-500" },
              { label: "Under Review", value: statusCounts?.under_review, icon: Eye, color: "text-blue-500" },
              { label: "Resolved", value: statusCounts?.resolved, icon: Check, color: "text-green-500" },
              { label: "Dismissed", value: statusCounts?.dismissed, icon: X, color: "text-muted-foreground" },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <div>
                    {stat.value === undefined ? (
                      <Skeleton className="h-7 w-10" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); setSelectedIds(new Set()); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fake_profile">Fake Profile</SelectItem>
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="inappropriate_content">Inappropriate</SelectItem>
                <SelectItem value="scam">Scam</SelectItem>
                <SelectItem value="underage">Underage</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="hate_speech">Hate Speech</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex gap-2 ml-auto items-center">
                <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("dismiss")}>
                  Dismiss Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("resolved")}>
                  Resolve Selected
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("escalate")}>
                  Escalate Selected
                </Button>
              </div>
            )}
          </div>

          {/* Reports list */}
          {reportsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : reportsError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">Failed to load reports</p>
              </CardContent>
            </Card>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No reports match your filters</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Select all */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.size === reports.length && reports.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select all on this page</span>
              </div>

              <div className="space-y-2">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className={`cursor-pointer transition-colors hover:border-primary/50 ${
                      selectedReport?.id === report.id ? "border-primary" : ""
                    }`}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.has(report.id)}
                        onCheckedChange={() => toggleSelect(report.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0" onClick={() => { setSelectedReport(report); setBlurEvidence(true); }}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={REPORT_TYPE_STYLES[report.reason] || REPORT_TYPE_STYLES.other}>
                            {(report.reason || "other").replace(/_/g, " ")}
                          </Badge>
                          <Badge className={STATUS_STYLES[report.status || "pending"]}>
                            {(report.status || "pending").replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {report.created_at ? new Date(report.created_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <p className="text-sm truncate">{report.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground mt-1">ID: {report.id.slice(-8)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages} ({totalReports} total)
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Side-by-side review panel */}
      {selectedReport && (
        <div className="w-[420px] border-l bg-card flex flex-col shrink-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-bold">Report Review</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Report info */}
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={REPORT_TYPE_STYLES[selectedReport.reason] || REPORT_TYPE_STYLES.other}>
                    {(selectedReport.reason || "").replace(/_/g, " ")}
                  </Badge>
                  <Badge className={STATUS_STYLES[selectedReport.status || "pending"]}>
                    {(selectedReport.status || "pending").replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-sm">{selectedReport.description || "No description provided"}</p>
                <p className="text-xs text-muted-foreground">
                  Filed {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : "N/A"}
                </p>
              </div>

              {/* Side-by-side profiles */}
              <div className="grid grid-cols-2 gap-3">
                {/* Reported user */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase">Reported User</h3>
                  {reportProfiles?.reported ? (
                    <div className="p-3 rounded-lg border bg-destructive/5">
                      <Avatar className="mb-2">
                        <AvatarImage src={reportProfiles.reported.primary_photo || undefined} />
                        <AvatarFallback>{reportProfiles.reported.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm truncate">{reportProfiles.reported.display_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {reportProfiles.reported.violation_count || 0} violations
                      </p>
                      {reportProfiles.reported.is_banned && <Badge variant="destructive" className="mt-1">Banned</Badge>}
                      {reportProfiles.reported.is_suspended && <Badge className="bg-orange-500 text-white mt-1">Suspended</Badge>}
                    </div>
                  ) : (
                    <Skeleton className="h-24" />
                  )}
                </div>

                {/* Reporter */}
                <div className="space-y-2">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase">Reporter</h3>
                  {reportProfiles?.reporter ? (
                    <div className="p-3 rounded-lg border">
                      <Avatar className="mb-2">
                        <AvatarImage src={reportProfiles.reporter.primary_photo || undefined} />
                        <AvatarFallback>{reportProfiles.reporter.display_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm truncate">{reportProfiles.reporter.display_name || "Unknown"}</p>
                    </div>
                  ) : (
                    <Skeleton className="h-24" />
                  )}
                </div>
              </div>

              {/* Evidence */}
              {selectedReport.evidence_urls && selectedReport.evidence_urls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase">Evidence</h3>
                    <Button variant="ghost" size="sm" onClick={() => setBlurEvidence(!blurEvidence)}>
                      {blurEvidence ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                      {blurEvidence ? "Show" : "Hide"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReport.evidence_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Evidence"
                        className={`w-full rounded-lg border ${blurEvidence ? "blur-lg" : ""} transition-all cursor-pointer`}
                        onClick={() => setBlurEvidence(false)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution info */}
              {selectedReport.resolution && (
                <div className="p-3 rounded-lg border bg-muted/50">
                  <p className="text-sm"><strong>Resolution:</strong> {selectedReport.resolution.replace(/_/g, " ")}</p>
                  {selectedReport.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Resolved {new Date(selectedReport.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Moderator notes (for pending) */}
              {(selectedReport.status === "pending" || selectedReport.status === "under_review") && (
                <div className="space-y-2">
                  <Label>Moderator Notes</Label>
                  <Textarea
                    value={moderatorNotes}
                    onChange={(e) => setModeratorNotes(e.target.value)}
                    placeholder="Add notes about this report..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action buttons */}
          {(selectedReport.status === "pending" || selectedReport.status === "under_review") && (
            <div className="p-4 border-t space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSingleAction("dismiss", "Dismiss")}
                  disabled={resolveReport.isPending}
                >
                  <X className="w-4 h-4 mr-1" /> Dismiss
                </Button>
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => handleSingleAction("warning", "Warning")}
                  disabled={resolveReport.isPending}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" /> Warn
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => handleSingleAction("temporary_ban", "Suspend")}
                  disabled={resolveReport.isPending}
                >
                  <Clock className="w-4 h-4 mr-1" /> Suspend
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleSingleAction("permanent_ban", "Permanent Ban")}
                  disabled={resolveReport.isPending}
                >
                  <Ban className="w-4 h-4 mr-1" /> Ban
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Destructive action confirmation */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(prev => ({ ...prev, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Permanent Ban</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently ban the reported user. This action is recorded in the audit log and is difficult to reverse. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                resolveReport.mutate({ reportId: selectedReport!.id, action: confirmDialog.action, notes: moderatorNotes });
                setConfirmDialog({ open: false, action: "", label: "" });
              }}
            >
              Confirm Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk action confirmation */}
      <AlertDialog open={!!bulkAction} onOpenChange={(o) => !o && setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Apply "{bulkAction?.replace(/_/g, " ")}" to {selectedIds.size} selected reports?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulk}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
