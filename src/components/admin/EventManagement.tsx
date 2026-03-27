// @ts-nocheck
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createRecord, deleteRecord, filterRecords, updateRecord, uploadFile } from '@/lib/supabase-helpers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Plus, Edit2, Trash2, DollarSign, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DEFAULT_FORM = {
  title: '',
  description: '',
  event_type: 'cultural_festival',
  image_url: '',
  start_date: '',
  end_date: '',
  location_name: '',
  location_address: '',
  city: '',
  country: '',
  is_virtual: false,
  virtual_link: '',
  max_attendees: 100,
  is_featured: false,
  price: 0,
  currency: 'USD',
  tags: [],
  is_active: true,
  status: 'upcoming'
};

export default function EventManagement({ events }) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState(null);
  const queryClient = useQueryClient();

  const handleViewRSVPs = (event) => setRsvpEvent(event);

  const { data: rsvpProfiles = [] } = useQuery({
    queryKey: ['event-rsvp-profiles', rsvpEvent?.id],
    queryFn: async () => {
      if (!rsvpEvent?.attendees?.length) return [];
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, primary_photo, photos, current_city, current_country, email')
        .in('id', rsvpEvent.attendees);
      return data || [];
    },
    enabled: !!rsvpEvent?.attendees?.length
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const saveData = {
        ...formData,
        max_attendees: parseInt(formData.max_attendees) || null,
        price: parseFloat(formData.price) || 0,
      };

      if (editingEvent) {
        await updateRecord('events', editingEvent.id, saveData);
      } else {
        await createRecord('events', {
          ...saveData,
          attendees: [],
          current_attendees: 0
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      setShowDialog(false);
      setEditingEvent(null);
      setFormData({ ...DEFAULT_FORM });
      toast.success(editingEvent ? 'Event updated' : 'Event created');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId) => {
      if (!confirm('Delete this event? This cannot be undone.')) return;
      await deleteRecord('events', eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event deleted');
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await uploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      toast.error('Photo upload failed');
    }
    setUploadingPhoto(false);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || 'cultural_festival',
      image_url: event.image_url || '',
      start_date: event.start_date ? event.start_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      location_name: event.location_name || '',
      location_address: event.location_address || '',
      city: event.city || '',
      country: event.country || '',
      is_virtual: event.is_virtual || false,
      virtual_link: event.virtual_link || '',
      max_attendees: event.max_attendees || 100,
      is_featured: event.is_featured || false,
      price: event.price || 0,
      currency: event.currency || 'USD',
      tags: event.tags || [],
      is_active: event.is_active !== false,
      status: event.status || 'upcoming'
    });
    setShowDialog(true);
  };

  const upcomingEvents = (events || []).filter(e => new Date(e.start_date) >= new Date());
  const pastEvents = (events || []).filter(e => new Date(e.start_date) < new Date());
  const totalAttendees = (events || []).reduce((sum, e) => sum + (e.attendees?.length || e.current_attendees || 0), 0);
  const totalRevenue = (events || []).reduce((sum, e) => sum + ((e.price || 0) * (e.attendees?.length || e.current_attendees || 0)), 0);

  const formatEventType = (type) => (type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{(events || []).length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users size={24} className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalAttendees}</p>
                <p className="text-sm text-muted-foreground">Total Attendees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={() => { setEditingEvent(null); setFormData({ ...DEFAULT_FORM }); setShowDialog(true); }}>
        <Plus size={18} className="mr-2" />
        Create Event
      </Button>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(events || []).map(event => (
              <div key={event.id} className="p-4 border rounded-lg hover:bg-muted">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{event.title}</h3>
                      {event.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
                      {event.is_virtual && <Badge variant="outline">Virtual</Badge>}
                      {new Date(event.start_date) < new Date() && (
                        <Badge variant="secondary">Past</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {event.start_date && format(new Date(event.start_date), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {event.is_virtual ? 'Virtual' : `${event.city || ''}${event.country ? `, ${event.country}` : ''}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {event.attendees?.length || event.current_attendees || 0}{event.max_attendees ? `/${event.max_attendees}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewRSVPs(event)}>
                      <Users size={16} className="mr-1" /> RSVPs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!events || events.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No events created yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          setEditingEvent(null);
          setFormData({ ...DEFAULT_FORM });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Event Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Event Photo</Label>
              {formData.image_url && (
                <img src={formData.image_url} alt="Event" className="w-full h-40 object-cover rounded-lg mb-2" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                disabled={uploadingPhoto}
              />
              {uploadingPhoto && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Event Type</Label>
                <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cultural_festival">Cultural Festival</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="speed_dating">Speed Dating</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="food_festival">Food Festival</SelectItem>
                    <SelectItem value="community_gathering">Community Gathering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Max Attendees</Label>
                <Input
                  type="number"
                  value={formData.max_attendees}
                  onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Date *</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_virtual}
                onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
              />
              <Label>Virtual Event</Label>
            </div>

            {formData.is_virtual ? (
              <div>
                <Label className="text-sm font-medium">Virtual Event Link</Label>
                <Input
                  value={formData.virtual_link}
                  onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                  className="mt-1"
                  placeholder="Zoom / Google Meet link"
                />
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium">Venue Name</Label>
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <Input
                    value={formData.location_address}
                    onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">City *</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Country *</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Price</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label>Featured Event</Label>
            </div>

            <Button
              onClick={() => createEventMutation.mutate()}
              disabled={!formData.title || !formData.start_date || createEventMutation.isPending}
              className="w-full"
            >
              {createEventMutation.isPending ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* RSVP Attendee List Dialog */}
      <Dialog open={!!rsvpEvent} onOpenChange={(open) => { if (!open) setRsvpEvent(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RSVPs — {rsvpEvent?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            {rsvpEvent?.attendees?.length || 0} registered attendees
            {rsvpEvent?.max_attendees ? ` / ${rsvpEvent.max_attendees} max` : ''}
          </p>
          {rsvpProfiles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No RSVPs yet</p>
          ) : (
            <div className="space-y-3">
              {rsvpProfiles.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <img
                    src={p.primary_photo || p.photos?.[0] || '/placeholder.svg'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{p.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.current_city}{p.current_country ? `, ${p.current_country}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}