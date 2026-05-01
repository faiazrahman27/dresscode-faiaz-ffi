-- ============================================================
-- Dresscode: close direct public scan table inserts
-- ============================================================
--
-- Why:
-- Public scan recording should go through public.record_public_scan(...)
-- so validation/rate-limit logic stays centralized server-side.
--
-- This removes direct INSERT access to public.scans for anon/authenticated
-- clients while preserving:
-- - authenticated SELECT for owners/admins through RLS
-- - scan recording through the SECURITY DEFINER RPC
-- - existing scan rows

-- ------------------------------------------------------------
-- 1. Remove direct INSERT policy on scans
-- ------------------------------------------------------------

drop policy if exists "public_can_insert_scans_for_active_qr"
on public.scans;

-- ------------------------------------------------------------
-- 2. Revoke direct INSERT table privileges
-- ------------------------------------------------------------

revoke insert on table public.scans from anon;
revoke insert on table public.scans from authenticated;

-- Keep authenticated read access because scan analytics uses SELECT/RPC-backed
-- owner/admin visibility policies.
grant select on table public.scans to authenticated;

-- ------------------------------------------------------------
-- 3. Keep controlled scan RPC executable
-- ------------------------------------------------------------

revoke all on function public.record_public_scan(uuid, text) from public;
grant execute on function public.record_public_scan(uuid, text) to anon, authenticated;
