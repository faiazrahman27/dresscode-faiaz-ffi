-- ============================================================
-- Dresscode: lock down direct user reads/updates on qr_codes
-- ============================================================
--
-- Why:
-- Migration 001 added email-bound activation.
-- Migration 002 removed broad public QR reads and added safe public RPCs.
--
-- Remaining problem:
-- Some authenticated/user QR policies may still allow normal users to read full
-- qr_codes rows. Because RLS is row-based, not column-based, direct SELECT access
-- can expose sensitive columns such as:
-- - scratch_code
-- - assigned_email
--
-- This migration:
-- 1. Removes normal-user direct SELECT/UPDATE access to qr_codes.
-- 2. Keeps admin management through the existing admin policy.
-- 3. Adds safe authenticated RPCs for user dashboard/editor data.
-- 4. Does not expose scratch_code or assigned_email through user RPCs.
--
-- IMPORTANT:
-- Do not run this migration until the frontend has been updated to use:
-- - get_my_qr_codes()
-- - get_my_scan_count()
-- - get_my_recent_scans(...)
-- - get_my_scan_breakdown()
-- - get_editable_qr_by_code(...)
--
-- Admin dashboard can still use direct qr_codes reads through the admin policy.

-- ------------------------------------------------------------
-- 1. Remove normal-user direct SELECT policies from qr_codes
-- ------------------------------------------------------------

drop policy if exists "Users can read their assigned QR codes"
on public.qr_codes;

drop policy if exists "users_can_view_email_assigned_qr_codes"
on public.qr_codes;

drop policy if exists "users_can_view_own_or_assigned_qr_codes"
on public.qr_codes;

-- ------------------------------------------------------------
-- 2. Remove normal-user direct UPDATE activation policies
-- ------------------------------------------------------------
--
-- Activation must happen through activate_qr_code(text, text), because that RPC
-- checks scratch_code and email/user assignment. Direct client UPDATE policies
-- can accidentally let users bypass scratch verification.

drop policy if exists "Users can activate eligible qr codes"
on public.qr_codes;

drop policy if exists "Users can activate their assigned QR codes"
on public.qr_codes;

-- ------------------------------------------------------------
-- 3. Safe authenticated QR list for the user dashboard
-- ------------------------------------------------------------
--
-- This returns only safe QR metadata for the signed-in user.
-- It does NOT return:
-- - scratch_code
-- - assigned_email

create or replace function public.get_my_qr_codes()
returns table (
  id uuid,
  code text,
  label text,
  code_type text,
  activated boolean,
  activated_by uuid,
  activated_at timestamptz,
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz,
  is_active boolean,
  template_id uuid,
  has_email_assignment boolean,
  assigned_to_current_email boolean,
  assigned_to_different_email boolean,
  has_user_assignment boolean,
  assigned_to_current_user boolean,
  assigned_to_different_user boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_email text;
begin
  v_uid := auth.uid();

  v_email := nullif(
    lower(
      trim(
        coalesce(
          auth.jwt() ->> 'email',
          current_setting('request.jwt.claim.email', true)
        )
      )
    ),
    ''
  );

  if v_uid is null then
    return;
  end if;

  return query
  select
    q.id,
    q.code::text,
    q.label::text,
    q.code_type::text,
    q.activated,
    q.activated_by,
    q.activated_at,
    q.assigned_to,
    q.created_by,
    q.created_at,
    q.is_active,
    q.template_id,

    nullif(lower(trim(q.assigned_email)), '') is not null
      as has_email_assignment,

    (
      v_email is not null
      and nullif(lower(trim(q.assigned_email)), '') = v_email
    ) as assigned_to_current_email,

    (
      v_email is not null
      and nullif(lower(trim(q.assigned_email)), '') is not null
      and nullif(lower(trim(q.assigned_email)), '') <> v_email
    ) as assigned_to_different_email,

    q.assigned_to is not null
      as has_user_assignment,

    (
      q.assigned_to is not null
      and q.assigned_to = v_uid
    ) as assigned_to_current_user,

    (
      q.assigned_to is not null
      and q.assigned_to <> v_uid
    ) as assigned_to_different_user

  from public.qr_codes q
  where
    q.activated_by = v_uid
    or q.assigned_to = v_uid
    or (
      v_email is not null
      and nullif(lower(trim(q.assigned_email)), '') = v_email
    )
  order by q.created_at desc;
end;
$$;

revoke all on function public.get_my_qr_codes() from public;
grant execute on function public.get_my_qr_codes() to authenticated;

-- ------------------------------------------------------------
-- 4. Safe QR lookup for the page editor
-- ------------------------------------------------------------
--
-- This lets the editor confirm that the signed-in user owns an activated open
-- code without exposing scratch_code or assigned_email.

create or replace function public.get_editable_qr_by_code(p_code text)
returns table (
  id uuid,
  code text,
  label text,
  code_type text,
  activated boolean,
  activated_by uuid,
  activated_at timestamptz,
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz,
  is_active boolean,
  template_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return;
  end if;

  return query
  select
    q.id,
    q.code::text,
    q.label::text,
    q.code_type::text,
    q.activated,
    q.activated_by,
    q.activated_at,
    q.assigned_to,
    q.created_by,
    q.created_at,
    q.is_active,
    q.template_id
  from public.qr_codes q
  where q.code = trim(p_code)
    and q.activated_by = v_uid
  limit 1;
end;
$$;

revoke all on function public.get_editable_qr_by_code(text) from public;
grant execute on function public.get_editable_qr_by_code(text) to authenticated;

-- ------------------------------------------------------------
-- 5. Safe authenticated scan count
-- ------------------------------------------------------------

create or replace function public.get_my_scan_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_count integer;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return 0;
  end if;

  select count(*)::integer
  into v_count
  from public.scans s
  join public.qr_codes q on q.id = s.qr_code_id
  where q.activated_by = v_uid;

  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.get_my_scan_count() from public;
grant execute on function public.get_my_scan_count() to authenticated;

-- ------------------------------------------------------------
-- 6. Safe authenticated recent scans
-- ------------------------------------------------------------

create or replace function public.get_my_recent_scans(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_limit integer;
  v_result jsonb;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return '[]'::jsonb;
  end if;

  v_limit := greatest(1, least(100, coalesce(p_limit, 20)));

  select coalesce(jsonb_agg(x.row_data order by x.scanned_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      s.scanned_at,
      to_jsonb(s) ||
      jsonb_build_object(
        'qr_code',
        jsonb_build_object(
          'code', q.code,
          'label', q.label
        )
      ) as row_data
    from public.scans s
    join public.qr_codes q on q.id = s.qr_code_id
    where q.activated_by = v_uid
    order by s.scanned_at desc
    limit v_limit
  ) x;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.get_my_recent_scans(integer) from public;
grant execute on function public.get_my_recent_scans(integer) to authenticated;

-- ------------------------------------------------------------
-- 7. Safe authenticated scan breakdown
-- ------------------------------------------------------------

create or replace function public.get_my_scan_breakdown()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_result jsonb;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return '[]'::jsonb;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'qr_code_id', x.qr_code_id,
        'code', x.code,
        'label', x.label,
        'scans', x.scans
      )
      order by x.scans desc
    ),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      q.id as qr_code_id,
      q.code,
      q.label,
      count(s.*)::integer as scans
    from public.qr_codes q
    left join public.scans s on s.qr_code_id = q.id
    where q.activated_by = v_uid
    group by q.id, q.code, q.label
  ) x;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.get_my_scan_breakdown() from public;
grant execute on function public.get_my_scan_breakdown() to authenticated;

-- ------------------------------------------------------------
-- 8. Keep required activation/public RPC grants
-- ------------------------------------------------------------

grant execute on function public.activate_qr_code(text, text) to authenticated;
grant execute on function public.get_public_qr_by_code(text) to anon, authenticated;
grant execute on function public.get_qr_activation_state(text) to anon, authenticated;
