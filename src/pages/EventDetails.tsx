// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { createRecord, filterRecords, getCurrentUser, updateRecord } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft, Calendar, MapPin, Users, Globe, Clock, DollarSign,
  Share2, Video, ExternalLink
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AfricanPattern from '@/components/shared/AfricanPattern';
import { toast } from '@/hooks/use-toast';

export default function EventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  
  const [myProfile, setMyProfile] = useState(null);
  const [showAttendees, setShowAttendees] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await getCurrentUser();
        const profiles = await filterRecords('user_profiles', { user_id: user.id });
        if (profiles.length > 0) {
          setMyProfile(profiles[0]);
        }
      } catch (e) {
        window.location.href = createPageUrl('Landing');
      }
    };
    fetchProfile();
  }, []);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await filterRecords('events', { id: eventId });
      return events[0];
    },
    enabled: !!eventId
  });

  // Fetch attendee profiles using individual lookups (no $in support)
  const { data: attendeeProfiles = [] } = useQuery({
    queryKey: ['event-attendees', event?.attendees],
    queryFn: async () => {
      if (!event?.attendees?.length) return [];
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, primary_photo, photos, current_city, current_country')
        .in('id', event.attendees);
      return data || [];
    },
    enabled: !!event?.attendees?.length
  });

  const isAttending = event?.attendees?.includes(myProfile?.id);
  const isFull = event?.max_attendees && (event?.attendees?.length || 0) >= event?.max_attendees;
  const isPast = event && new Date(event.start_date) < new Date();

  const rsvpMutation = useMutation({
    mutationFn: async ({ attending }) => {
      let updatedAttendees = event.attendees || [];
      
      if (attending) {
        if (updatedAttendees.includes(myProfile.id)) return;
        updatedAttendees = [...updatedAttendees, myProfile.id];
        
        // Create RSVP notification
        await createRecord('notifications', {
          user_profile_id: myProfile.id,
          user_id: myProfile.user_id,
          type: 'admin_message',
          title: 'Event RSVP Confirmed! 🎉',
          message: `You're registered for "${event.title}" on ${format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}. ${event.is_virtual && event.virtual_link ? 'Join link will be available on the event page.' : event.location_name ? `Location: ${event.location_name}` : ''}`,
          link_to: createPageUrl(`EventDetails?id=${eventId}`)
        });
      } else {
        updatedAttendees = updatedAttendees.filter(id => id !== myProfile.id);
      }
      
      await updateRecord('events', eventId, {
        attendees: updatedAttendees,
        current_attendees: updatedAttendees.length
      });

      return attending;
    },
    onSuccess: (attending) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      if (attending) {
        toast({ title: '🎉 RSVP Confirmed!', description: `You're registered for ${event.title}. Check your notifications for details.` });
      } else {
        toast({ title: 'RSVP Cancelled', description: 'You have been removed from this event.' });
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    }
  });

  const handleShare = async () => {
    const shareData = {
      title: event?.title,
      text: `Check out this event: ${event?.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Event link copied!' });
    }
  };

  const formatEventType = (type) => {
    return (type || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-purple-50/30 to-amber-50/20 relative pb-24">
      <AfricanPattern className="text-purple-600" opacity={0.03} />

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('Events')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft size={24} />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 size={20} />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Hero Image */}
        {event.image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-6 shadow-xl"
          >
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 backdrop-blur text-white">
                  {formatEventType(event.event_type)}
                </Badge>
                {event.is_featured && <Badge className="bg-amber-500">Featured</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
            </div>
          </motion.div>
        )}

        {!event.image_url && (
          <div className="mb-6">
            <Badge className="bg-purple-100 text-purple-700 mb-2">{formatEventType(event.event_type)}</Badge>
            <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
          </div>
        )}

        {/* Quick Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-purple-600 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start_date), 'h:mm a')}
                      {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                    </p>
                  </div>
                </div>

                {event.is_virtual ? (
                  <div className="flex items-start gap-3">
                    <Globe size={20} className="text-purple-600 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Virtual Event</p>
                      {event.virtual_link && isAttending && (
                        <a
                          href={event.virtual_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                          Join Event <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-purple-600 mt-1" />
                    <div>
                      {event.location_name && <p className="font-semibold text-foreground">{event.location_name}</p>}
                      {event.location_address && <p className="text-sm text-muted-foreground">{event.location_address}</p>}
                      <p className="text-sm text-muted-foreground">{event.city}{event.country ? `, ${event.country}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users size={20} className="text-purple-600 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {event.attendees?.length || 0} Attending
                    </p>
                    {event.max_attendees && (
                      <p className="text-sm text-muted-foreground">
                        {Math.max(0, event.max_attendees - (event.attendees?.length || 0))} spots left
                      </p>
                    )}
                    {attendeeProfiles.length > 0 && (
                      <button
                        onClick={() => setShowAttendees(true)}
                        className="text-sm text-purple-600 hover:underline mt-1"
                      >
                        See who's going
                      </button>
                    )}
                  </div>
                </div>

                {event.price > 0 && (
                  <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-purple-600 mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">
                        ${event.price} {event.currency || 'USD'}
                      </p>
                      <p className="text-sm text-muted-foreground">Ticket Price</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">About This Event</h2>
            <p className="text-foreground whitespace-pre-line">{event.description}</p>
            
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {event.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP Button */}
        {!isPast && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t p-4 safe-area-inset-bottom z-30">
            <div className="max-w-4xl mx-auto">
              {isAttending ? (
                <div className="space-y-2">
                  <Link to={createPageUrl(`EventChat?id=${event.id}`)}>
                    <Button className="w-full py-6 text-lg bg-purple-600 hover:bg-purple-700">
                      Join Event Chat
                    </Button>
                  </Link>
                  {event.virtual_link && (
                    <Button
                      onClick={() => window.open(event.virtual_link, '_blank')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Video size={20} className="mr-2" />
                      Join Event Now
                    </Button>
                  )}
                  <Button
                    onClick={() => rsvpMutation.mutate({ attending: false })}
                    disabled={rsvpMutation.isPending}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel RSVP
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => rsvpMutation.mutate({ attending: true })}
                  disabled={isFull || rsvpMutation.isPending || !myProfile}
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                >
                  {isFull ? 'Event Full' : rsvpMutation.isPending ? 'Joining...' : 'RSVP to Event'}
                </Button>
              )}
            </div>
          </div>
        )}

        {isPast && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-center">
              <p className="text-amber-700 font-medium">This event has ended</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Attendees Modal */}
      <Dialog open={showAttendees} onOpenChange={setShowAttendees}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendees ({attendeeProfiles.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {attendeeProfiles.map(profile => (
              <Link
                key={profile.id}
                to={createPageUrl(`Profile?id=${profile.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition"
              >
                <Avatar>
                  <AvatarImage src={profile.primary_photo || profile.photos?.[0]} />
                  <AvatarFallback>{profile.display_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{profile.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.current_city}{profile.current_country ? `, ${profile.current_country}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}