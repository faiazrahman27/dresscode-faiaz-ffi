create or replace function public.activate_qr_code(
  p_code text,
  p_scratch_code text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_qr public.qr_codes%rowtype;
  v_profile public.code_profiles%rowtype;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    return json_build_object(
      'success', false,
      'message', 'You must be signed in to activate a code.'
    );
  end if;

  select *
  into v_qr
  from public.qr_codes
  where code = p_code
  limit 1;

  if v_qr.id is null then
    return json_build_object(
      'success', false,
      'message', 'QR code not found.'
    );
  end if;

  if v_qr.is_active is false then
    return json_build_object(
      'success', false,
      'message', 'This QR code is inactive.'
    );
  end if;

  if v_qr.activated is true then
    return json_build_object(
      'success', false,
      'message', 'This QR code has already been activated.'
    );
  end if;

  if v_qr.scratch_code <> p_scratch_code then
    return json_build_object(
      'success', false,
      'message', 'Invalid scratch code.'
    );
  end if;

  update public.qr_codes
  set
    activated = true,
    activated_by = v_user_id,
    activated_at = now()
  where id = v_qr.id
    and activated = false;

  if not found then
    return json_build_object(
      'success', false,
      'message', 'Activation failed. The code may have been claimed already.'
    );
  end if;

  insert into public.code_profiles (
    qr_code_id,
    user_id,
    full_name,
    bio,
    accent
  )
  select
    v_qr.id,
    p.id,
    p.full_name,
    p.bio,
    coalesce(p.accent_color, '#5ECFCF')
  from public.profiles p
  where p.id = v_user_id
  on conflict (qr_code_id) do nothing
  returning * into v_profile;

  return json_build_object(
    'success', true,
    'message', 'QR code activated successfully.',
    'code', v_qr.code,
    'qr_code_id', v_qr.id
  );
end;
$$;
