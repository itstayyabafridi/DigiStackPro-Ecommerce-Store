-- Run after migrations using the Supabase SQL editor.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-files','product-files',false,104857600,NULL),
  ('payment-proofs','payment-proofs',false,5242880,ARRAY['image/jpeg','image/png','image/webp']),
  ('store-images','store-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- New Supabase projects enable RLS on storage.objects. These restrictive policies
-- also guard against an accidentally broad permissive policy added elsewhere.
DROP POLICY IF EXISTS digistack_private_read ON storage.objects;
CREATE POLICY digistack_private_read ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated
USING (bucket_id NOT IN ('product-files','payment-proofs'));
DROP POLICY IF EXISTS digistack_server_uploads ON storage.objects;
CREATE POLICY digistack_server_uploads ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id NOT IN ('product-files','payment-proofs','store-images'));
DROP POLICY IF EXISTS digistack_server_updates ON storage.objects;
CREATE POLICY digistack_server_updates ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
USING (bucket_id NOT IN ('product-files','payment-proofs','store-images'));
DROP POLICY IF EXISTS digistack_server_deletes ON storage.objects;
CREATE POLICY digistack_server_deletes ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated
USING (bucket_id NOT IN ('product-files','payment-proofs','store-images'));
-- Service-role generated signed uploads/downloads authorize individual objects.
-- Never add public SELECT policies for product-files or payment-proofs.
