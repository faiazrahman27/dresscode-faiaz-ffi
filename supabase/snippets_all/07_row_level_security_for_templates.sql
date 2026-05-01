create policy "public_can_read_templates"
on public.content_templates
for select
to anon, authenticated
using (true);

create policy "admins_can_manage_templates"
on public.content_templates
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);