-- Tighten waitlist insert: require email to be non-empty (prevents empty spam inserts)
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist_entries;
CREATE POLICY "Anyone can insert waitlist with email" ON public.waitlist_entries
  FOR INSERT WITH CHECK (email IS NOT NULL AND length(trim(email)) > 5);