create policy "public_can_read_published_articles"
on public.articles
for select
to anon, authenticated
using (published = true);

create policy "admins_can_manage_articles"
on public.articles
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

create policy "journalists_can_manage_own_articles"
on public.articles
for all
to authenticated
using (
  author_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('journalist', 'admin')
  )
)
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('journalist', 'admin')
  )
);