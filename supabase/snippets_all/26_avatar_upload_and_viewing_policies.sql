create policy "Authenticated users can upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars');

create policy "Anyone can view avatars"
on storage.objects
for select
to public
using (bucket_id = 'avatars');
