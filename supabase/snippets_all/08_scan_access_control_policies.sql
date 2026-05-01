create policy "public_can_insert_scans"
on public.scans
for insert
to anon, authenticated
with check (true);

create policy "owners_and_admins_can_view_scans"
on public.scans
for select
to authenticated
using (
  exists (
    select 1
    from public.qr_codes q
    where q.id = scans.qr_code_id
      and (
        q.activated_by = auth.uid()
        or q.assigned_to = auth.uid()
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
  )
);