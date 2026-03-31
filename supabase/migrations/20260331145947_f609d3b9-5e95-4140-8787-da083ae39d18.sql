-- Force drop old permissive ALL policies that weren't removed
DROP POLICY IF EXISTS "Auth can manage chat games" ON public.chat_games;
DROP POLICY IF EXISTS "Authenticated can manage date plans" ON public.date_plans;
DROP POLICY IF EXISTS "Auth can manage language exchanges" ON public.language_exchanges;
DROP POLICY IF EXISTS "Auth can manage live locations" ON public.live_locations;
DROP POLICY IF EXISTS "Auth can manage translations" ON public.message_translations;
DROP POLICY IF EXISTS "Auth can manage photo engagements" ON public.photo_engagements;
DROP POLICY IF EXISTS "Auth can manage suggestions" ON public.profile_suggestions;
DROP POLICY IF EXISTS "Users can manage own results" ON public.quiz_results;
DROP POLICY IF EXISTS "Auth can manage story comments" ON public.story_comments;
DROP POLICY IF EXISTS "Auth can manage video calls" ON public.video_calls;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist_entries;