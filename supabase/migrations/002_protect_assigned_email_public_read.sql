-- ============================================================
-- Dresscode: protect email-bound QR assignments from public reads
-- ============================================================
--
-- Why this migration exists:
-- The previous email-bound activation migration added qr_codes.assigned_email.
-- Existing public QR resolution policy allowed anon/authenticated users to read
-- active qr_codes rows directly. Because RLS is row-based, not column-based,
-- assigned_email could be exposed if public clients selected from qr_codes.
--
-- This migration:
-- 1. Removes the broad public direct-read policy on qr_codes.
-- 2. Adds a safe public RPC for QR/profile resolution that never returns
--    assigned_email or scratch_code.
-- 3. Adds a safe activation-state RPC that returns assignment booleans, not
--    the assigned email.
-- 4. Preserves admin/user/private access through existing authenticated policies.
--
-- IMPORTANT:
-- Run this only after updating src/lib/qr.js to use these RPCs instead of
-- direct public select('*') from qr_codes.

-- ------------------------------------------------------------
-- 1. Remove broad public direct read policy from qr_codes
-- ------------------------------------------------------------

drop policy if exists "public_can_read_active_qr_codes_for_profile_resolution"
on public.qr_codes;

-- ------------------------------------------------------------
-- 2. Safe public QR lookup for /p/:code
-- ------------------------------------------------------------
--
-- This function is intentionally SECURITY DEFINER so public pages can resolve
-- an active QR by code without direct SELECT access to public.qr_codes.
--
-- It does NOT return:
-- - scratch_code
-- - assigned_email
--
-- It returns only fields needed by public profile rendering.

create or replace function public.get_public_qr_by_code(p_code text)
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
language sql
security definer
set search_path = public
as $$
  select
    q.id,
    q.code,
    q.label,
    q.code_type,
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
    and q.is_active = true
  limit 1;
$$;

revoke all on function public.get_public_qr_by_code(text) from public;
grant execute on function public.get_public_qr_by_code(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Safe activation-state lookup for /activate/:code
-- ------------------------------------------------------------
--
-- This function gives the activation page enough information to display
-- correct messages without exposing assigned_email.
--
-- It returns:
-- - has_email_assignment
-- - assigned_to_current_email
-- - assigned_to_different_email
--
-- It does NOT return assigned_email.

create or replace function public.get_qr_activation_state(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_user_email text;
  v_qr public.qr_codes%rowtype;
  v_assigned_email text;
  v_has_email_assignment boolean;
  v_assigned_to_current_email boolean;
  v_assigned_to_different_email boolean;
  v_has_user_assignment boolean;
  v_assigned_to_current_user boolean;
  v_assigned_to_different_user boolean;
begin
  v_uid := auth.uid();

  v_user_email := nullif(
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

  select *
  into v_qr
  from public.qr_codes
  where code = trim(p_code)
    and is_active = true
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'QR code not found.'
    );
  end if;

  v_assigned_email := nullif(lower(trim(v_qr.assigned_email)), '');
  v_has_email_assignment := v_assigned_email is not null;

  v_has_user_assignment := v_qr.assigned_to is not null;

  v_assigned_to_current_user :=
    v_uid is not null
    and v_has_user_assignment
    and v_qr.assigned_to = v_uid;

  v_assigned_to_different_user :=
    v_uid is not null
    and v_has_user_assignment
    and v_qr.assigned_to <> v_uid;

  v_assigned_to_current_email :=
    v_user_email is not null
    and v_has_email_assignment
    and v_assigned_email = v_user_email;

  v_assigned_to_different_email :=
    v_user_email is not null
    and v_has_email_assignment
    and v_assigned_email <> v_user_email;

  return jsonb_build_object(
    'success', true,
    'qr', jsonb_build_object(
      'id', v_qr.id,
      'code', v_qr.code,
      'label', v_qr.label,
      'code_type', v_qr.code_type,
      'activated', v_qr.activated,
      'activated_by', v_qr.activated_by,
      'activated_at', v_qr.activated_at,
      'assigned_to', v_qr.assigned_to,
      'created_by', v_qr.created_by,
      'created_at', v_qr.created_at,
      'is_active', v_qr.is_active,
      'template_id', v_qr.template_id,

      -- Safe assignment state. No assigned_email is returned.
      'has_email_assignment', v_has_email_assignment,
      'assigned_to_current_email', v_assigned_to_current_email,
      'assigned_to_different_email', v_assigned_to_different_email,
      'has_user_assignment', v_has_user_assignment,
      'assigned_to_current_user', v_assigned_to_current_user,
      'assigned_to_different_user', v_assigned_to_different_user
    )
  );
end;
$$;

revoke all on function public.get_qr_activation_state(text) from public;
grant execute on function public.get_qr_activation_state(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 4. Keep activation RPC executable by authenticated users
-- ------------------------------------------------------------

grant execute on function public.activate_qr_code(text, text) to authenticated;
