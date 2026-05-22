-- Create the meal-photos storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-photos',
  'meal-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users (admin) can upload, update, and delete
CREATE POLICY "Authenticated users can upload meal photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'meal-photos');

CREATE POLICY "Authenticated users can update meal photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'meal-photos');

CREATE POLICY "Authenticated users can delete meal photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'meal-photos');

-- Anyone can read (bucket is public, but explicit policy for clarity)
CREATE POLICY "Public can read meal photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'meal-photos');
