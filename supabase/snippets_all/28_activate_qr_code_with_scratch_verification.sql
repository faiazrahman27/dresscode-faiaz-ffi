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
  v_qr public.qr_codes%rowtype;
  v_profile_exists boolean;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return jsonb_build_object(
      'success', false,
      'message', 'You must be signed in.'
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
      'message', 'This QR code is inactive.'
    );
  end if;

  if v_qr.activated is true then
    return jsonb_build_object(
      'success', false,
      'message', 'This QR code has already been activated.'
    );
  end if;

  if upper(trim(v_qr.scratch_code)) <> upper(trim(p_scratch_code)) then
    return jsonb_build_object(
      'success', false,
      'message', 'Scratch code is incorrect.'
    );
  end if;

  if v_qr.assigned_to is not null and v_qr.assigned_to <> v_uid then
    return jsonb_build_object(
      'success', false,
      'message', 'This QR code is assigned to a different user.'
    );
  end if;

  update public.qr_codes
  set
    activated = true,
    activated_by = v_uid,
    activated_at = now(),
    assigned_to = coalesce(assigned_to, v_uid)
  where id = v_qr.id;

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
      );
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
    'codeType', v_qr.code_type
  );
end;
$$;
