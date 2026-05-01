-- ============================================================
-- Dresscode: public RPC rate limits + safe public scan recording
-- ============================================================
--
-- Why:
-- The app is a static React/Vite + Supabase app, so security hardening has to
-- happen at the Supabase/RPC/RLS layer, not Express/Fastify middleware.
--
-- This migration:
-- 1. Adds database-backed rate limiting for public/high-risk RPCs.
-- 2. Adds strict code/scratch-code input validation inside public RPCs.
-- 3. Rate-limits:
--    - get_public_qr_by_code
--    - get_qr_activation_state
--    - activate_qr_code
--    - record_public_scan
-- 4. Replaces direct public scan inserts with a safe SECURITY DEFINER RPC.
-- 5. Revokes direct anon/authenticated INSERT on scans.
--
-- IMPORTANT:
-- Do not run this migration until src/lib/qr.js is updated to use
-- record_public_scan() instead of direct inserts into public.scans.

-- ------------------------------------------------------------
-- 1. Internal rate-limit bucket table
-- ------------------------------------------------------------

create table if not exists public.api_rate_limits (
  bucket_key text primary key,
  scope text not null,
  subject_type text not null,
  subject_hash text not null,
  window_start timestamptz not null default now(),
  request_count integer not null default 0,
  blocked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint api_rate_limits_subject_type_check
    check (subject_type in ('ip', 'user', 'code', 'qr'))
);

create index if not exists idx_api_rate_limits_scope_updated
on public.api_rate_limits (scope, updated_at desc);

alter table public.api_rate_limits enable row level security;

revoke all on table public.api_rate_limits from anon;
revoke all on table public.api_rate_limits from authenticated;

-- ------------------------------------------------------------
-- 2. Request IP extraction helper
-- ------------------------------------------------------------
--
-- Supabase/PostgREST exposes request headers through request.headers.
-- We prefer forwarded IP headers, then fall back to "unknown".
-- This function stores no raw IP in api_rate_limits; the limiter hashes it.

create or replace function public.get_request_ip()
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_headers_raw text;
  v_headers jsonb;
  v_forwarded text;
  v_real_ip text;
  v_cf_ip text;
  v_ip text;
begin
  v_headers_raw := current_setting('request.headers', true);

  if v_headers_raw is not null and v_headers_raw <> '' then
    begin
      v_headers := v_headers_raw::jsonb;
    exception
      when others then
        v_headers := '{}'::jsonb;
    end;
  else
    v_headers := '{}'::jsonb;
  end if;

  v_forwarded := nullif(trim(v_headers ->> 'x-forwarded-for'), '');
  v_real_ip := nullif(trim(v_headers ->> 'x-real-ip'), '');
  v_cf_ip := nullif(trim(v_headers ->> 'cf-connecting-ip'), '');

  if v_forwarded is not null then
    v_ip := trim(split_part(v_forwarded, ',', 1));
  else
    v_ip := coalesce(v_cf_ip, v_real_ip, 'unknown');
  end if;

  return lower(coalesce(nullif(v_ip, ''), 'unknown'));
end;
$$;

revoke all on function public.get_request_ip() from public;

-- ------------------------------------------------------------
-- 3. Generic rate-limit helper
-- ------------------------------------------------------------
--
-- The helper stores only md5-hashed subject values, not raw IPs/emails.
-- It returns JSON so public RPCs can gracefully return status 429.

create or replace function public.check_rate_limit(
  p_scope text,
  p_subject_type text,
  p_subject_value text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns jsonb
language plpgsql
security definer
volatile
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_scope text;
  v_subject_type text;
  v_subject_value text;
  v_subject_hash text;
  v_bucket_key text;
  v_row public.api_rate_limits%rowtype;
  v_limit integer;
  v_window_seconds integer;
  v_block_seconds integer;
  v_retry_after integer;
begin
  v_scope := left(coalesce(nullif(trim(p_scope), ''), 'unknown'), 120);
  v_subject_type := coalesce(nullif(trim(p_subject_type), ''), 'ip');
  v_subject_value := coalesce(nullif(trim(p_subject_value), ''), 'unknown');

  if v_subject_type not in ('ip', 'user', 'code', 'qr') then
    v_subject_type := 'ip';
  end if;

  v_limit := greatest(1, least(10000, coalesce(p_limit, 60)));
  v_window_seconds := greatest(10, least(86400, coalesce(p_window_seconds, 60)));
  v_block_seconds := greatest(10, least(86400, coalesce(p_block_seconds, 60)));

  v_subject_hash := md5('dresscode:v1:' || v_subject_type || ':' || v_subject_value);
  v_bucket_key := md5('dresscode:v1:' || v_scope || ':' || v_subject_type || ':' || v_subject_value);

  insert into public.api_rate_limits (
    bucket_key,
    scope,
    subject_type,
    subject_hash,
    window_start,
    request_count,
    blocked_until,
    created_at,
    updated_at
  )
  values (
    v_bucket_key,
    v_scope,
    v_subject_type,
    v_subject_hash,
    v_now,
    0,
    null,
    v_now,
    v_now
  )
  on conflict (bucket_key) do nothing;

  select *
  into v_row
  from public.api_rate_limits
  where bucket_key = v_bucket_key
  for update;

  if v_row.blocked_until is not null and v_row.blocked_until > v_now then
    v_retry_after := greatest(1, ceil(extract(epoch from (v_row.blocked_until - v_now)))::integer);

    return jsonb_build_object(
      'allowed', false,
      'status', 429,
      'retryAfterSeconds', v_retry_after,
      'message', 'Too many requests. Please wait before trying again.'
    );
  end if;

  if v_row.window_start + make_interval(secs => v_window_seconds) <= v_now then
    update public.api_rate_limits
    set
      window_start = v_now,
      request_count = 1,
      blocked_until = null,
      updated_at = v_now
    where bucket_key = v_bucket_key;

    return jsonb_build_object(
      'allowed', true,
      'remaining', greatest(0, v_limit - 1)
    );
  end if;

  if v_row.request_count + 1 > v_limit then
    update public.api_rate_limits
    set
      request_count = v_row.request_count + 1,
      blocked_until = v_now + make_interval(secs => v_block_seconds),
      updated_at = v_now
    where bucket_key = v_bucket_key;

    return jsonb_build_object(
      'allowed', false,
      'status', 429,
      'retryAfterSeconds', v_block_seconds,
      'message', 'Too many requests. Please wait before trying again.'
    );
  end if;

  update public.api_rate_limits
  set
    request_count = v_row.request_count + 1,
    blocked_until = null,
    updated_at = v_now
  where bucket_key = v_bucket_key;

  -- Lightweight cleanup to prevent stale bucket buildup.
  if random() < 0.01 then
    delete from public.api_rate_limits
    where updated_at < now() - interval '2 days';
  end if;

  return jsonb_build_object(
    'allowed', true,
    'remaining', greatest(0, v_limit - (v_row.request_count + 1))
  );
end;
$$;

revoke all on function public.check_rate_limit(text, text, text, integer, integer, integer) from public;

-- ------------------------------------------------------------
-- 4. Endpoint-level limiter helper
-- ------------------------------------------------------------
--
-- Every protected endpoint checks:
-- - IP bucket
-- - user bucket when authenticated

create or replace function public.check_endpoint_rate_limit(
  p_scope text,
  p_ip_limit integer,
  p_user_limit integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns jsonb
language plpgsql
security definer
volatile
set search_path = public
as $$
declare
  v_ip text;
  v_uid uuid;
  v_result jsonb;
begin
  v_ip := public.get_request_ip();

  v_result := public.check_rate_limit(
    p_scope,
    'ip',
    v_ip,
    p_ip_limit,
    p_window_seconds,
    p_block_seconds
  );

  if coalesce((v_result ->> 'allowed')::boolean, false) is false then
    return v_result;
  end if;

  v_uid := auth.uid();

  if v_uid is not null then
    v_result := public.check_rate_limit(
      p_scope,
      'user',
      v_uid::text,
      p_user_limit,
      p_window_seconds,
      p_block_seconds
    );

    if coalesce((v_result ->> 'allowed')::boolean, false) is false then
      return v_result;
    end if;
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

revoke all on function public.check_endpoint_rate_limit(text, integer, integer, integer, integer) from public;

-- ------------------------------------------------------------
-- 5. Harden get_public_qr_by_code
-- ------------------------------------------------------------
--
-- This function returns TABLE, so it cannot return a JSON 429 object without
-- changing the frontend contract. If limited, it returns no row.
-- The main frontend flow uses get_qr_activation_state, which returns graceful
-- JSON errors.

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
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_limit jsonb;
begin
  v_code := nullif(trim(coalesce(p_code, '')), '');

  if v_code is null
    or length(v_code) > 80
    or v_code !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$' then
    return;
  end if;

  v_limit := public.check_endpoint_rate_limit(
    'get_public_qr_by_code',
    240,
    480,
    60,
    60
  );

  if coalesce((v_limit ->> 'allowed')::boolean, false) is false then
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
  where q.code = v_code
    and q.is_active = true
  limit 1;
end;
$$;

revoke all on function public.get_public_qr_by_code(text) from public;
grant execute on function public.get_public_qr_by_code(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 6. Harden get_qr_activation_state
-- ------------------------------------------------------------

create or replace function public.get_qr_activation_state(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_limit jsonb;
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
  v_code := nullif(trim(coalesce(p_code, '')), '');

  if v_code is null
    or length(v_code) > 80
    or v_code !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$' then
    return jsonb_build_object(
      'success', false,
      'status', 400,
      'message', 'Invalid QR code format.'
    );
  end if;

  v_limit := public.check_endpoint_rate_limit(
    'get_qr_activation_state',
    240,
    480,
    60,
    60
  );

  if coalesce((v_limit ->> 'allowed')::boolean, false) is false then
    return jsonb_build_object(
      'success', false,
      'status', 429,
      'retryAfterSeconds', coalesce((v_limit ->> 'retryAfterSeconds')::integer, 60),
      'message', coalesce(v_limit ->> 'message', 'Too many requests. Please wait before trying again.')
    );
  end if;

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
  where code = v_code
    and is_active = true
  limit 1;

  if not found then
    return jsonb_build_object(
      'success', false,
      'status', 404,
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
-- 7. Harden activate_qr_code
-- ------------------------------------------------------------

create or replace function public.activate_qr_code(
  p_code text,
  p_scratch_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_scratch_code text;
  v_limit jsonb;
  v_code_limit jsonb;
  v_uid uuid;
  v_user_email text;
  v_assigned_email text;
  v_qr public.qr_codes%rowtype;
  v_profile_exists boolean;
begin
  v_code := nullif(trim(coalesce(p_code, '')), '');
  v_scratch_code := upper(nullif(trim(coalesce(p_scratch_code, '')), ''));

  if v_code is null
    or length(v_code) > 80
    or v_code !~ '^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$' then
    return jsonb_build_object(
      'success', false,
      'status', 400,
      'message', 'Invalid QR code format.'
    );
  end if;

  if v_scratch_code is null
    or length(v_scratch_code) <> 14
    or v_scratch_code !~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then
    return jsonb_build_object(
      'success', false,
      'status', 400,
      'message', 'Invalid scratch code format.'
    );
  end if;

  v_limit := public.check_endpoint_rate_limit(
    'activate_qr_code',
    20,
    12,
    600,
    600
  );

  if coalesce((v_limit ->> 'allowed')::boolean, false) is false then
    return jsonb_build_object(
      'success', false,
      'status', 429,
      'retryAfterSeconds', coalesce((v_limit ->> 'retryAfterSeconds')::integer, 600),
      'message', coalesce(v_limit ->> 'message', 'Too many activation attempts. Please wait before trying again.')
    );
  end if;

  -- Per-code throttling slows brute-force attempts across many accounts/IPs.
  v_code_limit := public.check_rate_limit(
    'activate_qr_code',
    'code',
    v_code,
    12,
    900,
    900
  );

  if coalesce((v_code_limit ->> 'allowed')::boolean, false) is false then
    return jsonb_build_object(
      'success', false,
      'status', 429,
      'retryAfterSeconds', coalesce((v_code_limit ->> 'retryAfterSeconds')::integer, 900),
      'message', 'Too many activation attempts for this code. Please wait before trying again.'
    );
  end if;

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

  if v_uid is null then
    return jsonb_build_object(
      'success', false,
      'status', 401,
      'message', 'Please sign in before activating this QR code.'
    );
  end if;

  select *
  into v_qr
  from public.qr_codes
  where code = v_code
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'status', 404,
      'message', 'QR code not found.'
    );
  end if;

  if v_qr.is_active is not true then
    return jsonb_build_object(
      'success', false,
      'status', 409,
      'message', 'This QR code is not active.'
    );
  end if;

  if v_qr.activated is true then
    return jsonb_build_object(
      'success', false,
      'status', 409,
      'message', 'This QR code has already been activated.'
    );
  end if;

  if v_qr.assigned_to is not null and v_qr.assigned_to <> v_uid then
    return jsonb_build_object(
      'success', false,
      'status', 403,
      'message', 'This QR code is assigned to another account.'
    );
  end if;

  v_assigned_email := nullif(lower(trim(v_qr.assigned_email)), '');

  if v_assigned_email is not null and v_assigned_email <> coalesce(v_user_email, '') then
    return jsonb_build_object(
      'success', false,
      'status', 403,
      'message', 'This QR code is assigned to another email. Please sign in with the email used for this assignment.'
    );
  end if;

  if upper(trim(v_qr.scratch_code)) <> v_scratch_code then
    return jsonb_build_object(
      'success', false,
      'status', 403,
      'message', 'Invalid scratch code.'
    );
  end if;

  update public.qr_codes
  set
    activated = true,
    activated_by = v_uid,
    activated_at = now(),
    assigned_to = coalesce(assigned_to, v_uid),
    assigned_email = v_assigned_email
  where id = v_qr.id
    and activated = false;

  if not found then
    return jsonb_build_object(
      'success', false,
      'status', 409,
      'message', 'Activation failed. The code may have been claimed already.'
    );
  end if;

  if v_qr.code_type = 'open' then
    select exists(
      select 1
      from public.code_profiles cp
      where cp.qr_code_id = v_qr.id
        and cp.user_id = v_uid
    )
    into v_profile_exists;

    if not v_profile_exists then
      insert into public.code_profiles (
        qr_code_id,
        user_id,
        full_name,
        bio,
        avatar_url,
        accent,
        page_data
      )
      values (
        v_qr.id,
        v_uid,
        '',
        '',
        '',
        '#5ECFCF',
        jsonb_build_object(
          'version', 1,
          'settings', jsonb_build_object(
            'accentColor', '#5ECFCF',
            'background', jsonb_build_object(
              'type', 'color',
              'value', '#0A1F1F',
              'gradientFrom', '#0A1F1F',
              'gradientTo', '#123B3B',
              'gradientDirection', '135deg'
            ),
            'redirectUrl', ''
          ),
          'navbar', jsonb_build_object(
            'enabled', false,
            'brandText', '',
            'links', jsonb_build_array()
          ),
          'sections', jsonb_build_array()
        )
      )
      on conflict (qr_code_id) do nothing;
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'message',
      case
        when v_qr.code_type = 'locked'
          then 'Locked QR code activated successfully. You can now access the official page.'
        else 'Open QR code activated successfully. You can now personalize your page.'
      end,
    'nextStep',
      case
        when v_qr.code_type = 'locked' then 'official-page'
        else 'editor'
      end,
    'codeType', v_qr.code_type,
    'code', v_qr.code,
    'qr_code_id', v_qr.id
  );
end;
$$;

revoke all on function public.activate_qr_code(text, text) from public;
grant execute on function public.activate_qr_code(text, text) to authenticated;

-- ------------------------------------------------------------
-- 8. Safe public scan recording RPC
-- ------------------------------------------------------------
--
-- Public profile pages need to record scans, but public clients should not have
-- direct INSERT access to public.scans.
--
-- This RPC:
-- - validates input
-- - requires the QR to exist, be active, and be activated
-- - rate-limits by IP and QR
-- - truncates/sanitizes device strings
-- - returns JSON success/error objects

create or replace function public.record_public_scan(
  p_qr_code_id uuid,
  p_device text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit jsonb;
  v_qr_limit jsonb;
  v_device text;
  v_qr_exists boolean;
begin
  if p_qr_code_id is null then
    return jsonb_build_object(
      'success', false,
      'status', 400,
      'message', 'QR code ID is required.'
    );
  end if;

  v_limit := public.check_endpoint_rate_limit(
    'record_public_scan',
    120,
    300,
    60,
    60
  );

  if coalesce((v_limit ->> 'allowed')::boolean, false) is false then
    return jsonb_build_object(
      'success', false,
      'status', 429,
      'retryAfterSeconds', coalesce((v_limit ->> 'retryAfterSeconds')::integer, 60),
      'message', coalesce(v_limit ->> 'message', 'Too many scan events. Please wait before trying again.')
    );
  end if;

  v_qr_limit := public.check_rate_limit(
    'record_public_scan',
    'qr',
    p_qr_code_id::text,
    600,
    60,
    60
  );

  if coalesce((v_qr_limit ->> 'allowed')::boolean, false) is false then
    return jsonb_build_object(
      'success', false,
      'status', 429,
      'retryAfterSeconds', coalesce((v_qr_limit ->> 'retryAfterSeconds')::integer, 60),
      'message', 'Too many scan events for this QR code. Please wait before trying again.'
    );
  end if;

  select exists(
    select 1
    from public.qr_codes q
    where q.id = p_qr_code_id
      and q.is_active = true
      and q.activated = true
  )
  into v_qr_exists;

  if not v_qr_exists then
    return jsonb_build_object(
      'success', false,
      'status', 404,
      'message', 'QR code not available for scan recording.'
    );
  end if;

  v_device := nullif(
    left(
      regexp_replace(coalesce(p_device, ''), '[[:cntrl:]]', '', 'g'),
      160
    ),
    ''
  );

  insert into public.scans (
    qr_code_id,
    device
  )
  values (
    p_qr_code_id,
    v_device
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Scan recorded.'
  );
end;
$$;

revoke all on function public.record_public_scan(uuid, text) from public;
grant execute on function public.record_public_scan(uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 9. Remove direct public scan insert access
-- ------------------------------------------------------------
--
-- Policy names may differ across your snippets, so we drop common names and
-- revoke direct INSERT grants. Public scan recording should use record_public_scan.

drop policy if exists "public_can_insert_scans"
on public.scans;

drop policy if exists "anon_can_insert_scans"
on public.scans;

drop policy if exists "Anyone can insert scans"
on public.scans;

drop policy if exists "Enable insert for all users"
on public.scans;

drop policy if exists "Enable insert for anon and authenticated users"
on public.scans;

revoke insert on public.scans from anon;
revoke insert on public.scans from authenticated;

-- Keep reads/writes governed by existing RLS/admin policies.
-- Existing authenticated analytics now use safe RPCs from migration 003.
