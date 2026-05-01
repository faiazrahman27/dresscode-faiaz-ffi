-- ============================================================
-- Dresscode: harden avatar/profile image uploads
-- ============================================================
--
-- Why:
-- Public profile pages need public image reads, but authenticated uploads should
-- not be unrestricted. The previous policy allowed any authenticated user to
-- upload any object into the avatars bucket.
--
-- This migration:
-- 1. Removes broad upload policies.
-- 2. Allows public read from avatars bucket.
-- 3. Allows authenticated users to upload only into their own top-level folder:
--    avatars/<auth.uid()>/...
-- 4. Restricts uploaded extensions to common safe image formats.
-- 5. Allows users to update/delete only objects in their own folder.

-- Remove older broad policies if they exist.
drop policy if exists "Authenticated users can upload avatars"
on storage.objects;

drop policy if exists "Anyone can view avatars"
on storage.objects;

drop policy if exists "Public can view avatars"
on storage.objects;

drop policy if exists "authenticated_can_upload_avatars"
on storage.objects;

drop policy if exists "users_can_upload_own_avatar_files"
on storage.objects;

drop policy if exists "users_can_update_own_avatar_files"
on storage.objects;

drop policy if exists "users_can_delete_own_avatar_files"
on storage.objects;

-- Public profile pages need to display uploaded images.
create policy "public_can_view_avatar_files"
on storage.objects
for select
to public
using (
  bucket_id = 'avatars'
);

-- Authenticated users can upload only into their own folder.
-- Path shape expected from frontend:
-- <user-id>/<folder>/<uuid>.<ext>
create policy "users_can_upload_own_avatar_files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  and length(name) <= 260
);

create policy "users_can_update_own_avatar_files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
  and length(name) <= 260
);

create policy "users_can_delete_own_avatar_files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
