-- 012_revoke_public_scan_helper_execution.sql
--
-- Purpose:
-- Direct public inserts into public.scans were closed in migration 010.
-- Public scan writes now go through public.record_public_scan(uuid, text).
--
-- This migration removes direct RPC execute access to the helper function
-- public.can_insert_scan_for_qr(uuid), because it is only needed internally
-- by database logic and should not be callable from public clients.

begin;

revoke execute on function public.can_insert_scan_for_qr(uuid) from public;
revoke execute on function public.can_insert_scan_for_qr(uuid) from anon;
revoke execute on function public.can_insert_scan_for_qr(uuid) from authenticated;

commit;
