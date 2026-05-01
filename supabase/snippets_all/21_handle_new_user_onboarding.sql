create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pending public.pending_assignments%rowtype;
begin
  -- Create profile
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do update
  set email = excluded.email;

  -- Find pending assignment
  select *
  into v_pending
  from public.pending_assignments
  where lower(email) = lower(new.email)
  order by created_at desc
  limit 1;

  -- If found → apply it
  if v_pending.id is not null then

    -- Update role
    update public.profiles
    set role = v_pending.role
    where id = new.id;

    -- Assign QR if exists
    if v_pending.qr_code_id is not null then
      update public.qr_codes
      set assigned_to = new.id
      where id = v_pending.qr_code_id;
    end if;

    -- Delete pending record
    delete from public.pending_assignments
    where id = v_pending.id;

  end if;

  return new;
end;
$$;
