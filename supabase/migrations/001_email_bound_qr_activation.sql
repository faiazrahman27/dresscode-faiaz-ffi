alter table public.qr_codes
add column if not exists assigned_email text;

update public.qr_codes
set assigned_email = nullif(lower(trim(assigned_email)), '')
where assigned_email is not null;

with latest_pending_assignment as (
  select distinct on (qr_code_id)
    qr_code_id,
    nullif(lower(trim(email)), '') as assigned_email
  from public.pending_assignments
  where qr_code_id is not null
  order by qr_code_id, created_at desc
)
update public.qr_codes q
set assigned_email = p.assigned_email
from latest_pending_assignment p
where q.id = p.qr_code_id
  and q.assigned_email is null
  and p.assigned_email is not null;

create index if not exists idx_qr_codes_assigned_email
on public.qr_codes (assigned_email);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'qr_codes'
      and policyname = 'users_can_view_email_assigned_qr_codes'
  ) then
    create policy "users_can_view_email_assigned_qr_codes"
    on public.qr_codes
    for select
    to authenticated
    using (
      nullif(lower(trim(assigned_email)), '') =
      nullif(
        lower(
          trim(
            coalesce(
              auth.jwt() ->> 'email',
              current_setting('request.jwt.claim.email', true)
            )
          )
        ),
        ''
      )
    );
  end if;
end $$;

drop function if exists public.activate_qr_code(text, text);

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
  v_uid uuid;
  v_user_email text;
  v_assigned_email text;
  v_qr public.qr_codes%rowtype;
  v_profile_exists boolean;
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

  if v_uid is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Please sign in before activating this QR code.'
    );
  end if;

  select *
  into v_qr
  from public.qr_codes
  where code = trim(p_code)
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'QR code not found.'
    );
  end if;

  if v_qr.is_active is not true then
    return jsonb_build_object(
      'success', false,
      'message', 'This QR code is not active.'
    );
  end if;

  if v_qr.activated is true then
    return jsonb_build_object(
      'success', false,
      'message', 'This QR code has already been activated.'
    );
  end if;

  if v_qr.assigned_to is not null and v_qr.assigned_to <> v_uid then
    return jsonb_build_object(
      'success', false,
      'message', 'This QR code is assigned to another account.'
    );
  end if;

  v_assigned_email := nullif(lower(trim(v_qr.assigned_email)), '');

  if v_assigned_email is not null and v_assigned_email <> coalesce(v_user_email, '') then
    return jsonb_build_object(
      'success', false,
      'message', 'This QR code is assigned to another email. Please sign in with the email used for this assignment.'
    );
  end if;

  if nullif(trim(p_scratch_code), '') is null
    or upper(trim(v_qr.scratch_code)) <> upper(trim(p_scratch_code)) then
    return jsonb_build_object(
      'success', false,
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

grant execute on function public.activate_qr_code(text, text) to authenticated;
