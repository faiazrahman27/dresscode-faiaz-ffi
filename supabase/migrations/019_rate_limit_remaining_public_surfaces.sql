-- ============================================================
-- Dresscode 019
-- Rate-limit remaining public/auth surfaces
-- ============================================================
--
-- Scope:
-- 1. Add a per-user rate limit to claim_welcome_email_send().
-- 2. Close old direct public inserts into contacts/newsletter.
--
-- This does not change current app functionality:
-- - Contact page currently uses Formspree, not public.contacts.
-- - Newsletter table is not used by the current frontend.
-- - Welcome email still sends once after verified login.

begin;

-- ------------------------------------------------------------
-- 1. Rate-limit welcome email claim
-- ------------------------------------------------------------

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
  v_rate jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required.'
      using errcode = '42501';
  end if;

  -- Authenticated-only per-user limiter.
  -- This prevents repeated calls to the welcome-email claim endpoint
  -- without relying on IP headers from Edge Function/server-to-PostgREST traffic.
  v_rate := public.check_rate_limit(
    'claim_welcome_email_send',
    'user',
    current_user_id::text,
    30,
    3600,
    900
  );

  if coalesce((v_rate ->> 'allowed')::boolean, false) is false then
    should_send := false;
    recipient_email := null;
    recipient_name := null;
    return next;
    return;
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

-- ------------------------------------------------------------
-- 2. Close old direct public inserts into contacts/newsletter
-- ------------------------------------------------------------
--
-- These tables came from the original snippets.
-- Current frontend contact flow uses Formspree, so direct Supabase inserts
-- are unnecessary and not rate-limited.
--
-- Admin select policies remain untouched.

drop policy if exists "public_can_insert_contacts" on public.contacts;
drop policy if exists "public_can_insert_newsletter" on public.newsletter;

revoke insert on table public.contacts from public;
revoke insert on table public.contacts from anon;
revoke insert on table public.contacts from authenticated;

revoke insert on table public.newsletter from public;
revoke insert on table public.newsletter from anon;
revoke insert on table public.newsletter from authenticated;

comment on table public.contacts is
  'Contact submissions table. Direct public inserts are disabled; current frontend uses Formspree. Add a rate-limited RPC before re-enabling Supabase-backed contact submissions.';

comment on table public.newsletter is
  'Newsletter table. Direct public inserts are disabled until a rate-limited RPC is added.';

commit;
