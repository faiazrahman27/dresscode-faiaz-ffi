-- Allow users to read their assigned QR codes

create policy "Users can read their assigned QR codes"
on public.qr_codes
for select
using (
  auth.uid() = assigned_to
);
