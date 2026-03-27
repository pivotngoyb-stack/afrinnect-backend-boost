import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 7 days from now
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    const oneWeekStr = oneWeekLater.toISOString().split('T')[0];

    // Fetch upcoming events that start today or in exactly 7 days
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, start_date, location_name, location_address, is_virtual, virtual_link, attendees, city, country')
      .eq('is_active', true)
      .or(`start_date.gte.${todayStr}T00:00:00,start_date.lte.${todayStr}T23:59:59,start_date.gte.${oneWeekStr}T00:00:00,start_date.lte.${oneWeekStr}T23:59:59`);

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    let totalSent = 0;

    for (const event of (events || [])) {
      if (!event.attendees?.length) continue;

      const eventDate = new Date(event.start_date);
      const eventDateStr = eventDate.toISOString().split('T')[0];

      let isToday = eventDateStr === todayStr;
      let isOneWeekAway = eventDateStr === oneWeekStr;

      if (!isToday && !isOneWeekAway) continue;

      const timeLabel = isToday ? 'today' : 'in 1 week';
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });

      const location = event.is_virtual
        ? 'Virtual Event'
        : [event.location_name, event.city, event.country].filter(Boolean).join(', ');

      const title = isToday
        ? `🎉 "${event.title}" is happening today!`
        : `📅 Reminder: "${event.title}" is ${timeLabel}`;

      const body = isToday
        ? `Get ready! Your event starts at ${formattedDate}. ${location}`
        : `Don't forget — ${formattedDate}. ${location}`;

      // Fetch attendee profiles with push tokens
      const { data: attendeeProfiles } = await supabase
        .from('user_profiles')
        .select('id, user_id, push_token, display_name')
        .in('id', event.attendees);

      for (const attendee of (attendeeProfiles || [])) {
        // Create in-app notification
        await supabase.from('notifications').insert({
          user_profile_id: attendee.id,
          user_id: attendee.user_id,
          type: 'event_reminder',
          title,
          message: body,
          is_read: false,
          link_to: `/events/${event.id}`,
        });

        // Send push if token available
        if (attendee.push_token) {
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: attendee.user_id,
                title,
                body,
                type: 'event_reminder',
                data: { eventId: event.id, screen: 'EventDetails' },
              },
            });
            totalSent++;
          } catch (pushErr) {
            console.error(`Push failed for ${attendee.user_id}:`, pushErr);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: totalSent, events_processed: events?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Event reminder error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});