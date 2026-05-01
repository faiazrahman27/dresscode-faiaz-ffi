-- Allow users to update their assigned QR codes

create policy "Users can activate their assigned QR codes"
on public.qr_codes
for update
using (
  auth.uid() = assigned_to
)
with check (
  auth.uid() = assigned_to
);
