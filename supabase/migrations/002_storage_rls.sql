-- ============================================================
-- RLS POLICIES for Supabase Storage bucket 'save-states'
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- 1. Allow public SELECT (read/download) — needed for public URLs and signed URLs
CREATE POLICY "allow_public_read_save_states"
ON storage.objects FOR SELECT
USING (bucket_id = 'save-states');

-- 2. Allow public INSERT (upload)
CREATE POLICY "allow_public_insert_save_states"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'save-states');

-- 3. Allow public UPDATE (overwrite saves)
CREATE POLICY "allow_public_update_save_states"
ON storage.objects FOR UPDATE
USING (bucket_id = 'save-states');

-- 4. Allow public DELETE (cleanup)
CREATE POLICY "allow_public_delete_save_states"
ON storage.objects FOR DELETE
USING (bucket_id = 'save-states');
