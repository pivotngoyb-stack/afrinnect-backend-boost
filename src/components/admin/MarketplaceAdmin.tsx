import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Store, Plus, Edit, Trash2, BadgeCheck, Star, MapPin, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'salon', label: 'Hair & Beauty' },
  { value: 'grocery', label: 'African Grocery' },
  { value: 'fashion', label: 'Fashion & Attire' },
  { value: 'services', label: 'Services' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'travel', label: 'Travel & Tours' },
  { value: 'finance', label: 'Money Transfer' },
  { value: 'realestate', label: 'Real Estate' },
  { value: 'legal', label: 'Legal & Immigration' },
  { value: 'tech', label: 'Tech Services' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  name: '', description: '', category: 'restaurant', subcategory: '',
  phone: '', email: '', website: '', address: '', city: '', country: '',
  latitude: '', longitude: '', image_url: '', logo_url: '',
  price_range: '$$', tags: '', is_featured: false, is_active: true, is_verified: false,
};

export default function MarketplaceAdmin() {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['admin-marketplace'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_businesses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: reviewStats = {} } = useQuery({
    queryKey: ['admin-review-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('business_reviews').select('business_id, rating');
      const stats: Record<string, { count: number; avg: number }> = {};
      (data || []).forEach(r => {
        if (!stats[r.business_id]) stats[r.business_id] = { count: 0, avg: 0 };
        stats[r.business_id].count++;
        stats[r.business_id].avg += r.rating;
      });
      Object.keys(stats).forEach(k => { stats[k].avg = stats[k].avg / stats[k].count; });
      return stats;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      delete payload.tags_str;

      if (editItem) {
        const { error } = await supabase.from('marketplace_businesses').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('marketplace_businesses').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace'] });
      toast.success(editItem ? 'Business updated!' : 'Business added!');
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketplace_businesses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace'] });
      toast.success('Business deleted');
    },
  });

  const openCreate = () => {
    setEditItem(null);
    setFormData(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (business: any) => {
    setEditItem(business);
    setFormData({
      ...business,
      latitude: business.latitude?.toString() || '',
      longitude: business.longitude?.toString() || '',
      tags: (business.tags || []).join(', '),
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditItem(null);
    setFormData(EMPTY_FORM);
  };

  const filtered = businesses.filter(b =>
    !searchQuery ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Store size={24} className="text-primary" /> Marketplace
          </h2>
          <p className="text-sm text-muted-foreground">{businesses.length} businesses listed</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-2" /> Add Business
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input placeholder="Search businesses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(b => {
                const stats = reviewStats[b.id];
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{b.name}</span>
                        {b.is_verified && <BadgeCheck size={14} className="text-primary" />}
                        {b.is_featured && <Badge variant="secondary" className="text-[10px]">Featured</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{CATEGORIES.find(c => c.value === b.category)?.label || b.category}</TableCell>
                    <TableCell className="text-sm">
                      {[b.city, b.country].filter(Boolean).join(', ') || '—'}
                      {b.latitude && <span className="text-[10px] text-muted-foreground ml-1">📍</span>}
                    </TableCell>
                    <TableCell>
                      {stats ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          {stats.avg.toFixed(1)} ({stats.count})
                        </span>
                      ) : <span className="text-muted-foreground text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.is_active ? 'default' : 'secondary'}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                          <Edit size={14} />
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => {
                          if (confirm('Delete this business?')) deleteMutation.mutate(b.id);
                        }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No businesses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Business' : 'Add New Business'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Business Name *</Label>
                <Input value={formData.name} onChange={e => updateField('name', e.target.value)} required />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={v => updateField('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price Range</Label>
                <Select value={formData.price_range} onValueChange={v => updateField('price_range', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (Budget)</SelectItem>
                    <SelectItem value="$$">$$ (Moderate)</SelectItem>
                    <SelectItem value="$$$">$$$ (Premium)</SelectItem>
                    <SelectItem value="$$$$">$$$$ (Luxury)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => updateField('description', e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} type="tel" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={formData.email} onChange={e => updateField('email', e.target.value)} type="email" />
              </div>
              <div className="col-span-2">
                <Label>Website</Label>
                <Input value={formData.website} onChange={e => updateField('website', e.target.value)} type="url" placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={e => updateField('address', e.target.value)} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={formData.city} onChange={e => updateField('city', e.target.value)} />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={formData.country} onChange={e => updateField('country', e.target.value)} />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input value={formData.latitude} onChange={e => updateField('latitude', e.target.value)} placeholder="e.g. 40.7128" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={formData.longitude} onChange={e => updateField('longitude', e.target.value)} placeholder="e.g. -74.0060" />
              </div>
              <div className="col-span-2">
                <Label>Image URL</Label>
                <Input value={formData.image_url} onChange={e => updateField('image_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={formData.tags} onChange={e => updateField('tags', e.target.value)} placeholder="e.g. jollof, nigerian, west-african" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.is_featured} onCheckedChange={v => updateField('is_featured', v)} />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.is_verified} onCheckedChange={v => updateField('is_verified', v)} />
                <Label>Verified</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.is_active} onCheckedChange={v => updateField('is_active', v)} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="animate-spin mr-2" size={14} />}
                {editItem ? 'Save Changes' : 'Add Business'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
