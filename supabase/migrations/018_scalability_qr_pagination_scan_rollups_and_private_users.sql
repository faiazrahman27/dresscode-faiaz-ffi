-- ============================================================
-- Dresscode 018
-- Scalability pass: app-private users, QR admin pagination support,
-- scan rollups, and scan indexes.
-- ============================================================
--
-- Scope:
-- 1. Remove the app-facing "all users" profile policies. User rows remain
--    visible from the Supabase dashboard/service role, but not from the public
--    web app client.
-- 2. Add indexes for scan analytics and admin QR listing filters/sorts.
-- 3. Add daily QR scan rollups and switch scan-count RPCs to read from rollups.
--
-- This migration does not remove a user's ability to view/update their own
-- profile. Existing own-profile policies remain in place.

begin;

-- ------------------------------------------------------------
-- 1. Remove app-facing all-user profile visibility/management
-- ------------------------------------------------------------

-- These policies powered the admin Users panel in the public web app.
-- Supabase dashboard access still works because dashboard/service-role access
-- bypasses normal app-client RLS policies.
drop policy if exists "profiles_admin_select_all" on public.profiles;
drop policy if exists "profiles_admin_update_all" on public.profiles;

comment on table public.profiles is
  'Application profiles. App clients can access their own profile only; all-user views are managed from Supabase dashboard/service-role context.';

-- ------------------------------------------------------------
-- 2. Indexes for scan analytics and admin QR listing
-- ------------------------------------------------------------

create index if not exists idx_scans_qr_code_id_scanned_at_desc
on public.scans(qr_code_id, scanned_at desc);

create index if not exists idx_scans_scanned_at_qr_code_id_desc
on public.scans(scanned_at desc, qr_code_id);

create index if not exists idx_qr_codes_activated_by_id
on public.qr_codes(activated_by, id)
where activated_by is not null;

create index if not exists idx_qr_codes_created_at_desc
on public.qr_codes(created_at desc);

create index if not exists idx_qr_codes_activated_created_at_desc
on public.qr_codes(activated, created_at desc);

create index if not exists idx_qr_codes_code_type_created_at_desc
on public.qr_codes(code_type, created_at desc);

create index if not exists idx_qr_codes_bulk_batch_id_created_at_desc
on public.qr_codes(bulk_batch_id, created_at desc)
where bulk_batch_id is not null;

create index if not exists idx_qr_codes_template_id_created_at_desc
on public.qr_codes(template_id, created_at desc)
where template_id is not null;

-- ------------------------------------------------------------
-- 3. Daily QR scan rollups
-- ------------------------------------------------------------

create table if not exists public.qr_scan_daily_stats (
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  scan_date date not null,
  scan_count bigint not null default 0 check (scan_count >= 0),
  first_scanned_at timestamptz,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (qr_code_id, scan_date)
);

alter table public.qr_scan_daily_stats enable row level security;

revoke all privileges on table public.qr_scan_daily_stats from public;
revoke all privileges on table public.qr_scan_daily_stats from anon;
revoke all privileges on table public.qr_scan_daily_stats from authenticated;

create index if not exists idx_qr_scan_daily_stats_date_qr
on public.qr_scan_daily_stats(scan_date desc, qr_code_id);

create index if not exists idx_qr_scan_daily_stats_qr_date
on public.qr_scan_daily_stats(qr_code_id, scan_date desc);

create or replace function public.upsert_qr_scan_daily_stats_from_scan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.qr_scan_daily_stats (
    qr_code_id,
    scan_date,
    scan_count,
    first_scanned_at,
    last_scanned_at
  )
  values (
    new.qr_code_id,
    new.scanned_at::date,
    1,
    new.scanned_at,
    new.scanned_at
  )
  on conflict (qr_code_id, scan_date)
  do update set
    scan_count = public.qr_scan_daily_stats.scan_count + 1,
    first_scanned_at = least(
      coalesce(public.qr_scan_daily_stats.first_scanned_at, excluded.first_scanned_at),
      excluded.first_scanned_at
    ),
    last_scanned_at = greatest(
      coalesce(public.qr_scan_daily_stats.last_scanned_at, excluded.last_scanned_at),
      excluded.last_scanned_at
    ),
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.upsert_qr_scan_daily_stats_from_scan() from public;

drop trigger if exists trg_upsert_qr_scan_daily_stats_from_scan on public.scans;

create trigger trg_upsert_qr_scan_daily_stats_from_scan
after insert on public.scans
for each row
execute function public.upsert_qr_scan_daily_stats_from_scan();

create or replace function public.refresh_qr_scan_daily_stats(
  p_from_date date default null,
  p_to_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from date;
  v_to date;
  v_rows integer;
begin
  select coalesce(p_from_date, min(scanned_at)::date, current_date)
  into v_from
  from public.scans;

  v_to := coalesce(p_to_date, current_date);

  if v_to < v_from then
    return jsonb_build_object(
      'success', false,
      'message', 'End date cannot be before start date.',
      'fromDate', v_from,
      'toDate', v_to,
      'rowsInserted', 0
    );
  end if;

  delete from public.qr_scan_daily_stats
  where scan_date between v_from and v_to;

  insert into public.qr_scan_daily_stats (
    qr_code_id,
    scan_date,
    scan_count,
    first_scanned_at,
    last_scanned_at
  )
  select
    s.qr_code_id,
    s.scanned_at::date as scan_date,
    count(*)::bigint as scan_count,
    min(s.scanned_at) as first_scanned_at,
    max(s.scanned_at) as last_scanned_at
  from public.scans s
  where s.scanned_at::date between v_from and v_to
  group by s.qr_code_id, s.scanned_at::date;

  get diagnostics v_rows = row_count;

  return jsonb_build_object(
    'success', true,
    'fromDate', v_from,
    'toDate', v_to,
    'rowsInserted', coalesce(v_rows, 0)
  );
end;
$$;

revoke all on function public.refresh_qr_scan_daily_stats(date, date) from public;
grant execute on function public.refresh_qr_scan_daily_stats(date, date) to service_role;

-- Backfill existing raw scan rows into the rollup table once during migration.
select public.refresh_qr_scan_daily_stats(null, null);

-- ------------------------------------------------------------
-- 4. Use rollups for owner scan totals and breakdowns
-- ------------------------------------------------------------

create or replace function public.get_my_scan_count()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_count bigint;
begin
  v_uid := auth.uid();

  if v_uid is null then
    return 0;
  end if;

  select coalesce(sum(stats.scan_count), 0)
  into v_count
  from public.qr_codes q
  left join public.qr_scan_daily_stats stats on stats.qr_code_id = q.id
  where q.activated_by = v_uid;

  return least(coalesce(v_count, 0), 2147483647)::integer;
end;
$$;

revoke all on function public.get_my_scan_count() from public;
grant execute on function public.get_my_scan_count() to authenticated;

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
      order by x.scans desc, x.code asc
    ),
    '[]'::jsonb
  )
  into v_result
  from (
    select
      q.id as qr_code_id,
      q.code,
      q.label,
      least(coalesce(sum(stats.scan_count), 0), 2147483647)::integer as scans
    from public.qr_codes q
    left join public.qr_scan_daily_stats stats on stats.qr_code_id = q.id
    where q.activated_by = v_uid
    group by q.id, q.code, q.label
  ) x;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

revoke all on function public.get_my_scan_breakdown() from public;
grant execute on function public.get_my_scan_breakdown() to authenticated;

commit;
