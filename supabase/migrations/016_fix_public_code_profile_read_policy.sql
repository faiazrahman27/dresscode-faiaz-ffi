-- ============================================================
-- Dresscode: fix public activated profile read policy
-- ============================================================
--
-- Problem:
-- Public profile rendering reads code_profiles.
-- The public code_profiles RLS policy checks qr_codes directly.
-- After table privilege hardening, anon users do not have direct SELECT
-- permission on qr_codes, so public profile pages can fail with:
-- "permission denied for table qr_codes".
--
-- Fix:
-- Keep qr_codes locked down.
-- Move the qr_codes check into a SECURITY DEFINER helper.
-- The RLS policy calls the helper instead of directly selecting qr_codes.

begin;

create or replace function public.is_public_activated_qr(
  p_qr_code_id uuid
)
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
      and q.activated = true
  );
$$;

revoke all on function public.is_public_activated_qr(uuid) from public;
grant execute on function public.is_public_activated_qr(uuid) to anon, authenticated;

drop policy if exists "public_can_read_code_profiles_when_code_is_active"
on public.code_profiles;

create policy "public_can_read_code_profiles_when_code_is_active"
on public.code_profiles
for select
to anon, authenticated
using (
  public.is_public_activated_qr(code_profiles.qr_code_id)
);

commit;
