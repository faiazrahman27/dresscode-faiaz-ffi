create policy "admins_can_manage_qr_codes"
on public.qr_codes
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

create policy "users_can_view_own_or_assigned_qr_codes"
on public.qr_codes
for select
to authenticated
using (
  activated_by = auth.uid()
  or assigned_to = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "public_can_read_active_qr_codes_for_profile_resolution"
on public.qr_codes
for select
to anon, authenticated
using (is_active = true);