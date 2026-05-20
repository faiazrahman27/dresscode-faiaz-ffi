-- 017_add_welcome_email_tracking.sql
-- Tracks welcome email delivery without exposing Resend or service-role secrets.

alter table public.profiles
add column if not exists welcome_email_sent_at timestamptz;

-- Existing users should not suddenly receive a welcome email.
-- Only future users with null welcome_email_sent_at should receive it.
update public.profiles
set welcome_email_sent_at = coalesce(welcome_email_sent_at, now())
where welcome_email_sent_at is null;

create or replace function public.claim_welcome_email_send()
returns table (
  should_send boolean,
  recipient_email text,
  recipient_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  -- Extra safety: only allow this after Supabase says the email is confirmed.
  if not exists (
    select 1
    from auth.users u
    where u.id = current_user_id
      and u.email_confirmed_at is not null
  ) then
    should_send := false;
    recipient_email := null;
    recipient_name := null;
    return next;
    return;
  end if;

  update public.profiles p
  set
    welcome_email_sent_at = now(),
    updated_at = now()
  where p.id = current_user_id
    and p.welcome_email_sent_at is null
    and p.email is not null
  returning p.email, p.full_name
  into recipient_email, recipient_name;

  if recipient_email is null then
    should_send := false;
    recipient_name := null;
    return next;
    return;
  end if;

  should_send := true;
  return next;
end;
$$;

revoke all on function public.claim_welcome_email_send() from public;
revoke all on function public.claim_welcome_email_send() from anon;
revoke all on function public.claim_welcome_email_send() from authenticated;

grant execute on function public.claim_welcome_email_send() to authenticated;