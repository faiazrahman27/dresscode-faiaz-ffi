create policy "public_can_insert_newsletter"
on public.newsletter
for insert
to anon, authenticated
with check (true);

create policy "admins_can_view_newsletter"
on public.newsletter
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "public_can_insert_contacts"
on public.contacts
for insert
to anon, authenticated
with check (true);

create policy "admins_can_view_contacts"
on public.contacts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);