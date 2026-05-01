create policy "users_can_view_own_code_profiles"
on public.code_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "users_can_insert_own_code_profiles"
on public.code_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "users_can_update_own_code_profiles"
on public.code_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "public_can_read_code_profiles_when_code_is_active"
on public.code_profiles
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.qr_codes q
    where q.id = code_profiles.qr_code_id
      and q.is_active = true
      and q.activated = true
  )
);