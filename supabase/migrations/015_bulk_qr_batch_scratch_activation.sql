-- ============================================================
-- Dresscode: bulk QR batch scratch activation
-- ============================================================
--
-- New behavior for QR codes generated after this migration:
-- - Every bulk-generated QR row gets the same bulk_batch_id.
-- - Any unused scratch code from that same bulk_batch_id can activate
--   any unactivated QR code in the same batch.
-- - A scratch code is consumed when it is used.
-- - The QR row that originally owns the consumed scratch code is NOT activated
--   unless that QR row is the actual QR being activated.
-- - Existing single QR codes and old pre-migration bulk QR codes keep the old
--   exact QR-code + scratch-code activation behavior because their bulk_batch_id
--   remains null.

alter table public.qr_codes
add column if not exists bulk_batch_id uuid,
add column if not exists scratch_claimed_by_qr_code_id uuid references public.qr_codes(id) on delete set null,
add column if not exists scratch_claimed_at timestamptz;

create index if not exists idx_qr_codes_bulk_batch_id
on public.qr_codes (bulk_batch_id)
where bulk_batch_id is not null;

create index if not exists idx_qr_codes_bulk_batch_scratch_lookup
on public.qr_codes (bulk_batch_id, scratch_code)
where bulk_batch_id is not null
  and scratch_claimed_by_qr_code_id is null;

create index if not exists idx_qr_codes_scratch_claimed_by
on public.qr_codes (scratch_claimed_by_qr_code_id)
where scratch_claimed_by_qr_code_id is not null;

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
  v_scratch_qr public.qr_codes%rowtype;
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

  -- Assignment protection stays attached to the QR code being activated.
  -- So if the target QR is reserved for another user/email, a batch scratch
  -- from the same batch still cannot bypass that reservation.
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

  if v_qr.bulk_batch_id is null then
    -- Existing behavior for single QR codes and old pre-migration bulk rows.
    if upper(trim(v_qr.scratch_code)) <> v_scratch_code then
      return jsonb_build_object(
        'success', false,
        'status', 403,
        'message', 'Invalid scratch code.'
      );
    end if;

    v_scratch_qr := v_qr;
  else
    -- New batch behavior: any unused scratch from this same bulk batch can
    -- activate the target QR code.
    select *
    into v_scratch_qr
    from public.qr_codes
    where bulk_batch_id = v_qr.bulk_batch_id
      and upper(trim(scratch_code)) = v_scratch_code
      and scratch_claimed_by_qr_code_id is null
    for update;

    if not found then
      return jsonb_build_object(
        'success', false,
        'status', 403,
        'message', 'Invalid or already used scratch code for this batch.'
      );
    end if;
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

  update public.qr_codes
  set
    scratch_claimed_by_qr_code_id = v_qr.id,
    scratch_claimed_at = now()
  where id = v_scratch_qr.id
    and scratch_claimed_by_qr_code_id is null;

  if not found then
    return jsonb_build_object(
      'success', false,
      'status', 409,
      'message', 'Activation failed. This scratch code was already used.'
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
