-- ============================================================
-- Dresscode: enforce avatars bucket MIME and size limits
-- ============================================================
--
-- Why:
-- Client-side validation and storage RLS are not enough by themselves.
-- Bucket-level limits make Supabase Storage reject unsupported file types
-- and oversized uploads even if someone bypasses the frontend.

update storage.buckets
set
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
where id = 'avatars';
