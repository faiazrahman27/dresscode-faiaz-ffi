-- 014_create_shop_products_storage_bucket.sql
--
-- Purpose:
-- Add a dedicated public Supabase Storage bucket for shop product/collectible images.
--
-- Frontend upload function:
--   uploadShopProductImage(file, folder)
--
-- Storage path format from src/lib/storage.js:
--   {user_id}/{folder}/{random_uuid}.{extension}
--
-- Only admins can upload/update/delete shop product images.
-- Public visitors can read/view images.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'shop-products',
  'shop-products',
  true,
  4194304,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists public_can_view_shop_product_files on storage.objects;
create policy public_can_view_shop_product_files
on storage.objects
for select
to public
using (
  bucket_id = 'shop-products'
);

drop policy if exists admins_can_upload_shop_product_files on storage.objects;
create policy admins_can_upload_shop_product_files
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-products'
  and auth.uid() is not null
  and public.is_current_user_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) = any (
    array['jpg', 'jpeg', 'png', 'webp', 'gif']
  )
  and length(name) <= 260
);

drop policy if exists admins_can_update_shop_product_files on storage.objects;
create policy admins_can_update_shop_product_files
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shop-products'
  and auth.uid() is not null
  and public.is_current_user_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'shop-products'
  and auth.uid() is not null
  and public.is_current_user_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) = any (
    array['jpg', 'jpeg', 'png', 'webp', 'gif']
  )
  and length(name) <= 260
);

drop policy if exists admins_can_delete_shop_product_files on storage.objects;
create policy admins_can_delete_shop_product_files
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shop-products'
  and auth.uid() is not null
  and public.is_current_user_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
