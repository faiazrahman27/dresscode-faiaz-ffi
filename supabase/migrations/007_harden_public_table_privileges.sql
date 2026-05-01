-- ============================================================
-- Dresscode 007: Lock down public table privileges
-- ============================================================
--
-- Purpose:
-- Previous grants allowed anon/authenticated roles to hold dangerous table-level
-- privileges such as DELETE, UPDATE, TRUNCATE, TRIGGER, and REFERENCES on public
-- tables. RLS still limits rows, but table grants should follow least privilege.
--
-- This migration:
-- 1. Removes broad table privileges from PUBLIC, anon, and authenticated.
-- 2. Re-grants only the privileges required by the current app.
-- 3. Keeps RLS policies as the row-level enforcement layer.
--
-- Important:
-- This does NOT change RLS policies.
-- This does NOT touch functions/RPC execute permissions.
-- This does NOT overwrite migration 006.

begin;

-- ------------------------------------------------------------
-- 1. Remove broad grants from all app-owned public tables
-- ------------------------------------------------------------

revoke all privileges on table public.articles from public;
revoke all privileges on table public.articles from anon;
revoke all privileges on table public.articles from authenticated;

revoke all privileges on table public.code_profiles from public;
revoke all privileges on table public.code_profiles from anon;
revoke all privileges on table public.code_profiles from authenticated;

revoke all privileges on table public.contacts from public;
revoke all privileges on table public.contacts from anon;
revoke all privileges on table public.contacts from authenticated;

revoke all privileges on table public.content_templates from public;
revoke all privileges on table public.content_templates from anon;
revoke all privileges on table public.content_templates from authenticated;

revoke all privileges on table public.newsletter from public;
revoke all privileges on table public.newsletter from anon;
revoke all privileges on table public.newsletter from authenticated;

revoke all privileges on table public.pending_assignments from public;
revoke all privileges on table public.pending_assignments from anon;
revoke all privileges on table public.pending_assignments from authenticated;

revoke all privileges on table public.profiles from public;
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.profiles from authenticated;

revoke all privileges on table public.qr_codes from public;
revoke all privileges on table public.qr_codes from anon;
revoke all privileges on table public.qr_codes from authenticated;

revoke all privileges on table public.scans from public;
revoke all privileges on table public.scans from anon;
revoke all privileges on table public.scans from authenticated;

-- ------------------------------------------------------------
-- 2. Public read surfaces
-- ------------------------------------------------------------
--
-- Public users can read only intentionally public content.
-- RLS still decides which rows are visible.

grant select on table public.articles to anon, authenticated;
grant select on table public.code_profiles to anon, authenticated;
grant select on table public.content_templates to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Public write surfaces
-- ------------------------------------------------------------
--
-- Public contact/newsletter inserts are allowed because their RLS policies
-- explicitly allow public INSERT. No public SELECT/UPDATE/DELETE is granted.

grant insert on table public.contacts to anon, authenticated;
grant insert on table public.newsletter to anon, authenticated;

-- Public scan recording.
-- If scan recording is handled only through a SECURITY DEFINER RPC later,
-- this direct INSERT grant can be removed in a future migration.
grant insert on table public.scans to anon, authenticated;

-- ------------------------------------------------------------
-- 4. Authenticated user surfaces
-- ------------------------------------------------------------

-- Profiles:
-- Users can create/read/update their own profile.
-- Admin-wide profile access is controlled by RLS from migration 006.
grant select, insert, update on table public.profiles to authenticated;

-- Code profiles:
-- Owners can create/update their own editable code profile.
-- Public SELECT is already granted above for activated public pages.
grant insert, update on table public.code_profiles to authenticated;

-- Scans:
-- Owners/admins can read scan analytics through RLS.
grant select on table public.scans to authenticated;

-- ------------------------------------------------------------
-- 5. Admin / role-gated dashboard surfaces
-- ------------------------------------------------------------
--
-- These grants allow authenticated users to attempt dashboard operations.
-- RLS policies still restrict actual access to admins/journalists/owners.

grant insert, update, delete on table public.articles to authenticated;

grant insert, update, delete on table public.content_templates to authenticated;

grant select on table public.contacts to authenticated;
grant select on table public.newsletter to authenticated;

grant select, insert, update, delete on table public.pending_assignments to authenticated;

grant select, insert, update, delete on table public.qr_codes to authenticated;

commit;
