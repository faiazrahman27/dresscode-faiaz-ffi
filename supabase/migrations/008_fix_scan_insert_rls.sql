-- ============================================================
-- Dresscode migration 008
-- Fix scan insert RLS safely
-- ============================================================
--
-- Why:
-- The scans table has RLS enabled and a SELECT policy for owners/admins,
-- but no INSERT policy. The public profile page records scans from the
-- browser, so anon/authenticated clients need a controlled way to insert
-- scan rows.
--
-- Security model:
-- - Anyone may insert a scan only for an existing active QR code.
-- - Clients cannot update, delete, truncate, or read arbitrary scan rows.
-- - SELECT remains limited to owners/admins through the existing policy.
-- - This preserves the existing frontend insertScan(qrCodeId) function.
--
-- This migration does not expose qr_codes directly to anon users.

-- ------------------------------------------------------------
-- 1. Helper: check if a QR code can receive public scans
-- ------------------------------------------------------------

create or replace function public.can_insert_scan_for_qr(p_qr_code_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.qr_codes q
    where q.id = p_qr_code_id
      and q.is_active = true
  );
$$;

revoke all on function public.can_insert_scan_for_qr(uuid) from public;
grant execute on function public.can_insert_scan_for_qr(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- 2. Remove any old/duplicate scan insert policies
-- ------------------------------------------------------------

drop policy if exists "public_can_insert_scans_for_active_qr"
on public.scans;

drop policy if exists "anon_and_authenticated_can_insert_scans"
on public.scans;

drop policy if exists "public_can_record_scans"
on public.scans;

-- ------------------------------------------------------------
-- 3. Allow controlled scan inserts
-- ------------------------------------------------------------
--
-- RLS WITH CHECK controls inserted rows.
-- The helper is SECURITY DEFINER so it can safely verify qr_codes without
-- granting public direct read access to qr_codes.

create policy "public_can_insert_scans_for_active_qr"
on public.scans
for insert
to anon, authenticated
with check (
  public.can_insert_scan_for_qr(qr_code_id)
);

-- ------------------------------------------------------------
-- 4. Keep only the required table privileges for scans
-- ------------------------------------------------------------

revoke all on table public.scans from anon;
revoke all on table public.scans from authenticated;

grant insert on table public.scans to anon;
grant insert, select on table public.scans to authenticated;

-- ------------------------------------------------------------
-- 5. Keep RLS enabled
-- ------------------------------------------------------------

alter table public.scans enable row level security;
