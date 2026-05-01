-- ============================================================
-- Dresscode Migration 009:
-- Lock down public function/RPC execution permissions
-- ============================================================
--
-- Purpose:
-- Supabase/Postgres functions can remain executable through the PUBLIC role
-- unless EXECUTE is explicitly revoked.
--
-- This migration:
-- 1. Revokes broad EXECUTE access from public, anon, and authenticated.
-- 2. Re-grants only the RPCs that the client actually needs.
-- 3. Keeps internal trigger/helper functions non-callable from the API.
--
-- Important:
-- This does not remove RLS.
-- This does not change table data.
-- This only controls which public schema functions can be called through RPC.

begin;

-- ------------------------------------------------------------
-- 1. Revoke broad function execution access
-- ------------------------------------------------------------

revoke execute on all functions in schema public from public;
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;

-- Prevent future functions from becoming executable through PUBLIC by default.
alter default privileges in schema public revoke execute on functions from public;

-- ------------------------------------------------------------
-- 2. Public-safe RPCs
-- ------------------------------------------------------------
-- These are intentionally callable by anon and authenticated users.

-- Public QR/profile lookup. Must not expose scratch_code or assigned_email.
grant execute on function public.get_public_qr_by_code(text)
to anon, authenticated;

-- Activation page state lookup. Returns safe booleans, not assigned_email.
grant execute on function public.get_qr_activation_state(text)
to anon, authenticated;

-- Public scan recording RPC. This should be the preferred scan insert path.
grant execute on function public.record_public_scan(uuid, text)
to anon, authenticated;

-- RLS helper used by the public scan INSERT policy.
-- Keep executable because anon INSERT into scans depends on this policy check.
grant execute on function public.can_insert_scan_for_qr(uuid)
to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Authenticated-only RPCs
-- ------------------------------------------------------------
-- These must not be callable by anon.

-- QR activation requires a signed-in user so ownership/email assignment can be enforced.
grant execute on function public.activate_qr_code(text, text)
to authenticated;

-- Page editor QR lookup. Must only work for signed-in owners/admin-safe flows.
grant execute on function public.get_editable_qr_by_code(text)
to authenticated;

-- Dashboard/private user data RPCs.
grant execute on function public.get_my_qr_codes()
to authenticated;

grant execute on function public.get_my_scan_count()
to authenticated;

grant execute on function public.get_my_scan_breakdown()
to authenticated;

grant execute on function public.get_my_recent_scans(integer)
to authenticated;

-- Helper used by RLS policies to check admin status.
-- Authenticated users can call it, but it only returns whether the current user is admin.
grant execute on function public.is_current_user_admin()
to authenticated;

-- ------------------------------------------------------------
-- 4. Intentionally NOT granted
-- ------------------------------------------------------------
-- The following functions should remain non-callable by anon/authenticated:
--
-- check_rate_limit(...)
-- check_endpoint_rate_limit(...)
-- get_request_ip()
-- handle_new_user()
-- prevent_non_admin_profile_role_change()
-- set_updated_at()
--
-- They are internal helpers/triggers and should not be exposed as public RPCs.

commit;
