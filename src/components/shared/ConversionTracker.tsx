import { supabase } from '@/integrations/supabase/client';

export function useConversionTracker() {
  const trackEvent = async (eventName, properties = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        // Log event if needed
        console.debug('Conversion event:', eventName, profiles?.[0]?.id);
      }
    } catch (e) {
      console.debug('Conversion tracking skipped:', eventName);
    }
  };

  return { trackEvent };
}

export const CONVERSION_EVENTS = {
  LANDING_VIEW: 'landing_viewed',
  SIGNUP_START: 'signup_started',
  SIGNUP_COMPLETE: 'signup_completed',
  PROFILE_CREATED: 'profile_created',
  FIRST_LIKE: 'first_like_sent',
  FIRST_MATCH: 'first_match_created',
  FIRST_MESSAGE: 'first_message_sent',
  PREMIUM_VIEW: 'premium_page_viewed',
  PREMIUM_CLICK: 'premium_upgrade_clicked',
  PREMIUM_PURCHASE: 'premium_purchased',
  STORY_VIEW: 'story_viewed',
  STORY_POST: 'story_posted',
  EVENT_JOIN: 'event_joined',
  COMMUNITY_JOIN: 'community_joined',
  VERIFICATION_REQUEST: 'verification_requested'
};
