
-- Fix storage INSERT policy - enforce path ownership
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload own photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Add UPDATE policy for photos bucket
CREATE POLICY "Users can update own photos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );
