-- ============================================================
-- Dresscode security hardening:
-- profiles role protection + code_profiles policy cleanup
-- ============================================================
--
-- Fixes:
-- 1. Prevents non-admin users from changing their own role to admin/journalist.
-- 2. Allows admins to view/update profile rows for the admin Users panel.
-- 3. Removes broad code_profiles INSERT/UPDATE policies that only checked auth.uid().
--
-- This is intentionally narrow. It does not change qr_codes, scans, templates,
-- storage, or public profile rendering.

-- ------------------------------------------------------------
-- 1. Helper: safely check whether the current authenticated user is admin
-- ------------------------------------------------------------

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

-- ------------------------------------------------------------
-- 2. Prevent non-admin users from changing profile.role
-- ------------------------------------------------------------

create or replace function public.prevent_non_admin_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Role changes are allowed only when the current authenticated user is admin.
  -- This prevents a normal user from manually updating their own role through
  -- the Supabase client or browser DevTools.
  if new.role is distinct from old.role then
    if not public.is_current_user_admin() then
      raise exception 'Only admins can change account roles.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_non_admin_profile_role_change
on public.profiles;

create trigger prevent_non_admin_profile_role_change
before update of role
on public.profiles
for each row
execute function public.prevent_non_admin_profile_role_change();

-- ------------------------------------------------------------
-- 3. Keep own-profile policies, add admin profile management policies
-- ------------------------------------------------------------

drop policy if exists "profiles_admin_select_all" on public.profiles;
drop policy if exists "profiles_admin_update_all" on public.profiles;

create policy "profiles_admin_select_all"
on public.profiles
for select
to authenticated
using (public.is_current_user_admin());

create policy "profiles_admin_update_all"
on public.profiles
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Existing own-profile policies can stay:
-- profiles_insert_own
-- profiles_select_own
-- profiles_update_own
--
-- The trigger above blocks non-admin role changes even if profiles_update_own
-- allows normal users to update their own profile row.

-- ------------------------------------------------------------
-- 4. Remove broad code_profiles policies
-- ------------------------------------------------------------
--
-- These policies are too broad because they allow any authenticated user to
-- insert/update code_profiles without checking ownership.
--
-- Safer existing policies remain:
-- users_can_insert_own_code_profiles
-- users_can_update_own_code_profiles
-- users_can_view_own_code_profiles
-- public_can_read_code_profiles_when_code_is_active

drop policy if exists "Code Profile Create NEW Policy"
on public.code_profiles;

drop policy if exists "Code Profile Update NEW Policy"
on public.code_profiles;
