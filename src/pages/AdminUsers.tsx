import React, { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, Search, MoreVertical, Eye, Ban, Clock, Shield,
  ChevronLeft, ChevronRight, Download, UserCheck, Crown, Star, 
  AlertTriangle, RefreshCw, X, Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string | null; user: any }>({ open: false, type: null, user: null });
  const [actionReason, setActionReason] = useState("");
  const [actionDuration, setActionDuration] = useState("24");

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  // Server-side data fetch
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users-server', page, debouncedSearch, statusFilter, tierFilter, sortBy],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: { 
          type: 'users', 
          page, 
          pageSize: PAGE_SIZE, 
          search: debouncedSearch, 
          status: statusFilter, 
          tier: tierFilter, 
          sort: sortBy 
        }
      });
      if (error) throw error;
      return data?.data;
    },
    staleTime: 30000,
  });

  const users = data?.users || [];
  const totalCount = data?.totalCount || 0;
  const stats = data?.stats;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: async ({ userId, updateData, actionType }: { userId: string; updateData: any; actionType: string }) => {
      const { error } = await supabase.from('user_profiles').update(updateData).eq('id', userId);
      if (error) throw error;

      // Log audit
      const { data: { user: admin } } = await supabase.auth.getUser();
      if (admin) {
        await supabase.from('admin_audit_logs').insert({
          admin_user_id: admin.id,
          action: actionType,
          target_id: userId,
          target_type: 'user_profile',
          details: { reason: actionReason, update: updateData },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-server'] });
      toast.success('Action completed successfully');
      setActionDialog({ open: false, type: null, user: null });
      setActionReason("");
    },
    onError: (err: Error) => {
      toast.error(`Action failed: ${err.message}`);
    },
  });

  const handleAction = () => {
    if (!actionDialog.user || !actionDialog.type) return;
    
    const updateData: Record<string, any> = {};
    let actionType = actionDialog.type;
    
    if (actionDialog.type === 'ban') {
      updateData.is_banned = true;
      updateData.ban_reason = actionReason;
      updateData.is_active = false;
    } else if (actionDialog.type === 'unban') {
      updateData.is_banned = false;
      updateData.ban_reason = null;
      updateData.is_active = true;
    } else if (actionDialog.type === 'suspend') {
      updateData.is_suspended = true;
      updateData.suspension_reason = actionReason;
      updateData.suspension_expires_at = new Date(Date.now() + parseInt(actionDuration) * 60 * 60 * 1000).toISOString();
    } else if (actionDialog.type === 'unsuspend') {
      updateData.is_suspended = false;
      updateData.suspension_reason = null;
      updateData.suspension_expires_at = null;
    } else if (actionDialog.type === 'verify') {
      updateData.is_verified = true;
    } else if (actionDialog.type === 'premium') {
      updateData.is_premium = true;
      updateData.subscription_tier = 'premium';
      updateData.premium_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (actionDialog.type === 'founding') {
      updateData.is_founding_member = true;
      updateData.founding_member_granted_at = new Date().toISOString();
    }

    actionMutation.mutate({ userId: actionDialog.user.id, updateData, actionType });
  };

  const getUserStatus = (u: any) => {
    if (u.is_banned) return { label: 'Banned', color: 'bg-red-500' };
    if (u.is_suspended) return { label: 'Suspended', color: 'bg-yellow-500' };
    if (!u.is_active) return { label: 'Inactive', color: 'bg-slate-500' };
    return { label: 'Active', color: 'bg-green-500' };
  };

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">User Management</h1>
              <p className="text-sm text-slate-400">{totalCount} users total</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => {
                const csv = [
                  ['Name', 'Gender', 'Status', 'Location', 'Joined'].join(','),
                  ...users.map((u: any) => [
                    `"${u.display_name || ''}"`, u.gender || '',
                    u.is_banned ? 'Banned' : u.is_active ? 'Active' : 'Inactive',
                    `"${u.current_city || ''}, ${u.current_country || ''}"`,
                    u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `users-export-page${page}.csv`; a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="w-4 h-4 mr-2" /> Export Page
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total', value: stats.totalUsers, color: 'text-white' },
                { label: 'Active', value: stats.activeUsers, color: 'text-green-400' },
                { label: 'Premium', value: stats.premiumUsers, color: 'text-orange-400' },
                { label: 'Verified', value: stats.verifiedUsers, color: 'text-blue-400' },
                { label: 'Banned', value: stats.bannedUsers, color: 'text-red-400' },
              ].map((s, i) => (
                <Card key={i} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <p className="text-slate-400 text-xs">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value?.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters */}
          <Card className="bg-slate-900 border-slate-800 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search by name, city, country..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Tier" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="founding">Founding</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
                  <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="-created_at">Newest First</SelectItem>
                    <SelectItem value="created_at">Oldest First</SelectItem>
                    <SelectItem value="-last_active">Recently Active</SelectItem>
                    <SelectItem value="display_name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40 bg-slate-700" />
                        <Skeleton className="h-3 w-60 bg-slate-700" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400">Failed to load users</p>
                  <Button variant="outline" className="mt-2 text-slate-300 border-slate-700" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users-server'] })}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left p-4 text-slate-400 font-medium">User</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Tier</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Location</th>
                        <th className="text-left p-4 text-slate-400 font-medium">Joined</th>
                        <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => {
                        const status = getUserStatus(u);
                        const age = getAge(u.birth_date);
                        return (
                          <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={u.primary_photo} />
                                  <AvatarFallback className="bg-slate-700 text-white">{u.display_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-white font-medium flex items-center gap-2">
                                    {u.display_name}
                                    {u.is_verified && <Shield className="w-4 h-4 text-blue-400" />}
                                  </p>
                                  <p className="text-slate-400 text-sm">{u.gender} {age ? `• ${age}` : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {u.is_founding_member && <Star className="w-4 h-4 text-yellow-400" />}
                                {u.is_premium && <Crown className="w-4 h-4 text-orange-400" />}
                                <span className="text-slate-300 capitalize">{u.subscription_tier || 'free'}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-300">
                              {u.current_city ? `${u.current_city}, ` : ''}{u.current_country}
                            </td>
                            <td className="p-4 text-slate-400">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-slate-400">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                  <DropdownMenuItem onClick={() => setSelectedUser(u)} className="text-slate-300 hover:text-white hover:bg-slate-700">
                                    <Eye className="w-4 h-4 mr-2" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-700" />
                                  {!u.is_banned ? (
                                    <>
                                      <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'suspend', user: u })} className="text-yellow-400 hover:bg-slate-700">
                                        <Clock className="w-4 h-4 mr-2" /> Suspend
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'ban', user: u })} className="text-red-400 hover:bg-slate-700">
                                        <Ban className="w-4 h-4 mr-2" /> Ban
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'unban', user: u })} className="text-green-400 hover:bg-slate-700">
                                      <UserCheck className="w-4 h-4 mr-2" /> Unban
                                    </DropdownMenuItem>
                                  )}
                                  {u.is_suspended && (
                                    <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'unsuspend', user: u })} className="text-green-400 hover:bg-slate-700">
                                      <Check className="w-4 h-4 mr-2" /> Remove Suspension
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-slate-700" />
                                  {!u.is_founding_member && (
                                    <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'founding', user: u })} className="text-yellow-400 hover:bg-slate-700">
                                      <Star className="w-4 h-4 mr-2" /> Grant Founding
                                    </DropdownMenuItem>
                                  )}
                                  {!u.is_premium && (
                                    <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: 'premium', user: u })} className="text-orange-400 hover:bg-slate-700">
                                      <Crown className="w-4 h-4 mr-2" /> Grant Premium
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {!isLoading && (
                <div className="flex items-center justify-between p-4 border-t border-slate-800">
                  <p className="text-slate-400 text-sm">
                    Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="border-slate-700 text-slate-300">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-slate-400 px-2">Page {page}{totalPages > 0 ? ` of ${totalPages}` : ''}</span>
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

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, user: null })}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionDialog.type === 'ban' && '⚠️ Permanently Ban User'}
              {actionDialog.type === 'unban' && 'Unban User'}
              {actionDialog.type === 'suspend' && 'Suspend User'}
              {actionDialog.type === 'unsuspend' && 'Remove Suspension'}
              {actionDialog.type === 'verify' && 'Verify User'}
              {actionDialog.type === 'premium' && 'Grant Premium'}
              {actionDialog.type === 'founding' && 'Grant Founding Member'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {actionDialog.user && (
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                <Avatar>
                  <AvatarImage src={actionDialog.user.primary_photo} />
                  <AvatarFallback>{actionDialog.user.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{actionDialog.user.display_name}</p>
                  <p className="text-slate-400 text-sm">ID: {actionDialog.user.id?.slice(0, 12)}...</p>
                </div>
              </div>
            )}

            {actionDialog.type === 'ban' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm font-medium">⚠️ This action is permanent and will immediately revoke all access.</p>
              </div>
            )}

            {['ban', 'suspend'].includes(actionDialog.type || '') && (
              <>
                <div>
                  <Label className="text-slate-300">Reason (required)</Label>
                  <Textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="mt-2 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                {actionDialog.type === 'suspend' && (
                  <div>
                    <Label className="text-slate-300">Duration</Label>
                    <Select value={actionDuration} onValueChange={setActionDuration}>
                      <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="72">3 days</SelectItem>
                        <SelectItem value="168">7 days</SelectItem>
                        <SelectItem value="720">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null, user: null })} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAction}
              disabled={actionMutation.isPending || (['ban', 'suspend'].includes(actionDialog.type || '') && !actionReason)}
              className={actionDialog.type === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}
            >
              {actionMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 z-50 shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">User Details</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="text-slate-400">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-65px)]">
            <div className="p-4 space-y-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={selectedUser.primary_photo} />
                  <AvatarFallback className="text-2xl">{selectedUser.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-white">{selectedUser.display_name}</h3>
                <p className="text-slate-400">{selectedUser.gender} • {selectedUser.current_city}, {selectedUser.current_country}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {selectedUser.is_premium && <Badge className="bg-orange-500">Premium</Badge>}
                  {selectedUser.is_founding_member && <Badge className="bg-yellow-500">Founding</Badge>}
                  {selectedUser.is_verified && <Badge className="bg-blue-500">Verified</Badge>}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">ID</span><span className="text-white font-mono text-xs">{selectedUser.id?.slice(0, 16)}...</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Joined</span><span className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Last Active</span><span className="text-white">{selectedUser.last_active ? new Date(selectedUser.last_active).toLocaleDateString() : 'Never'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Tier</span><span className="text-white capitalize">{selectedUser.subscription_tier || 'free'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Streak</span><span className="text-white">{selectedUser.login_streak || 0} days</span></div>
              </div>
              {selectedUser.photos?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 uppercase mb-2">Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedUser.photos.map((photo: string, i: number) => (
                      <img key={i} src={photo} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
