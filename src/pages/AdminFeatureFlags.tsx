import React, { useState, useEffect } from 'react';
import { createRecord, deleteRecord, filterRecords, getCurrentUser, listRecords, updateRecord } from '@/lib/supabase-helpers';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Zap, Plus, RefreshCw, Search, ToggleLeft, ToggleRight, Trash2, Edit, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  percentage?: number;
  target_audience?: string;
  config?: Record<string, unknown>;
}

interface FlagFormData {
  name: string;
  description: string;
  is_enabled: boolean;
  percentage: number;
  target_audience: string;
  config: Record<string, unknown>;
}

const DEFAULT_FORM: FlagFormData = {
  name: '', description: '', is_enabled: false,
  percentage: 100, target_audience: 'all', config: {}
};

export default function AdminFeatureFlags() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState<FlagFormData>(DEFAULT_FORM);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        navigate(createPageUrl('Home'));
        return;
      }
      await loadFlags();
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadFlags = async () => {
    setLoading(true);
    try {
      const data = await listRecords('feature_flags', '-created_at', 200);
      setFlags(data);
    } catch (e) {
      console.error('Error loading flags:', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      if (editingFlag) {
        await updateRecord('feature_flags', editingFlag.id, formData);
        toast.success('Feature flag updated');
      } else {
        await createRecord('feature_flags', formData);
        toast.success('Feature flag created');
      }
      setShowDialog(false);
      setEditingFlag(null);
      setFormData({ name: '', description: '', is_enabled: false, percentage: 100, target_audience: 'all', config: {} });
      await loadFlags();
    } catch (e) {
      toast.error('Error saving flag');
    }
  };

  const toggleFlag = async (flag) => {
    try {
      await updateRecord('feature_flags', flag.id, { is_enabled: !flag.is_enabled });
      setFlags(flags.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f));
      toast.success(`${flag.name} ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (e) {
      toast.error('Error toggling flag');
    }
  };

  const deleteFlag = async (id) => {
    try {
      await deleteRecord('feature_flags', id);
      setFlags(flags.filter(f => f.id !== id));
      toast.success('Flag deleted');
    } catch (e) {
      toast.error('Error deleting flag');
    }
  };

  const openEdit = (flag) => {
    setEditingFlag(flag);
    setFormData({
      name: flag.name, description: flag.description || '',
      is_enabled: flag.is_enabled, percentage: flag.percentage || 100,
      target_audience: flag.target_audience || 'all', config: flag.config || {}
    });
    setShowDialog(true);
  };

  const filteredFlags = flags.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = flags.filter(f => f.is_enabled).length;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar activePage="AdminFeatureFlags" />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Feature Flags</h1>
              <p className="text-sm text-slate-400">{flags.length} flags • {enabledCount} enabled</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search flags..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-64 pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Button onClick={loadFlags} variant="outline" className="border-slate-700 text-slate-300">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button onClick={() => { setEditingFlag(null); setFormData({ name: '', description: '', is_enabled: false, percentage: 100, target_audience: 'all', config: {} }); setShowDialog(true); }} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> New Flag
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-20">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading feature flags...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFlags.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-12 text-center">
                    <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No feature flags found</p>
                    <Button onClick={() => setShowDialog(true)} className="mt-4 bg-orange-500 hover:bg-orange-600">
                      <Plus className="w-4 h-4 mr-2" /> Create First Flag
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredFlags.map(flag => (
                  <Card key={flag.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Switch
                            checked={flag.is_enabled}
                            onCheckedChange={() => toggleFlag(flag)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">{flag.name}</h3>
                              <Badge variant="outline" className={flag.is_enabled ? 'border-green-500 text-green-400' : 'border-slate-600 text-slate-400'}>
                                {flag.is_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                              {flag.percentage < 100 && (
                                <Badge variant="outline" className="border-blue-500 text-blue-400">
                                  {flag.percentage}% rollout
                                </Badge>
                              )}
                              <Badge variant="outline" className="border-slate-600 text-slate-400">
                                {flag.target_audience || 'all'}
                              </Badge>
                            </div>
                            {flag.description && (
                              <p className="text-sm text-slate-400 mt-1">{flag.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(flag)} className="text-slate-400 hover:text-white">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteFlag(flag.id)} className="text-slate-400 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingFlag ? 'Edit Feature Flag' : 'Create Feature Flag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="e.g., dark_mode_v2" />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="What does this flag control?" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formData.is_enabled} onCheckedChange={v => setFormData({ ...formData, is_enabled: v })} />
              <Label className="text-slate-300">Enabled</Label>
            </div>
            <div>
              <Label className="text-slate-300">Rollout Percentage: {formData.percentage}%</Label>
              <Slider value={[formData.percentage]} onValueChange={v => setFormData({ ...formData, percentage: v[0] })} max={100} step={5} className="mt-2" />
            </div>
            <div>
              <Label className="text-slate-300">Target Audience</Label>
              <Select value={formData.target_audience} onValueChange={v => setFormData({ ...formData, target_audience: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="premium">Premium Only</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                  <SelectItem value="new">New Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="border-slate-700 text-slate-300">Cancel</Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              <Save className="w-4 h-4 mr-2" /> {editingFlag ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
