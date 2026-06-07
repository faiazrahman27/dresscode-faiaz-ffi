drop function if exists public.admin_search_qr_codes(text, text, text, integer, integer);

create or replace function public.admin_search_qr_codes(
  p_search text default '',
  p_filter text default 'all',
  p_sort_by text default 'created_desc',
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  code text,
  scratch_code text,
  label text,
  code_type text,
  template_id uuid,
  assigned_email text,
  assigned_to uuid,
  activated boolean,
  is_active boolean,
  created_by uuid,
  activated_by uuid,
  activated_at timestamptz,
  created_at timestamptz,
  bulk_batch_id uuid,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_search text := lower(trim(coalesce(p_search, '')));
  v_normalized_search text := regexp_replace(lower(trim(coalesce(p_search, ''))), '[^a-z0-9@._-]+', ' ', 'g');
  v_filter text := lower(trim(coalesce(p_filter, 'all')));
  v_sort_by text := lower(trim(coalesce(p_sort_by, 'created_desc')));
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 1000));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
begin
  if auth.uid() is null or not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  with base as (
    select
      q.id,
      q.code,
      q.scratch_code,
      q.label,
      q.code_type,
      q.template_id,
      q.assigned_email,
      q.assigned_to,
      q.activated,
      q.is_active,
      q.created_by,
      nullif(to_jsonb(q)->>'activated_by', '')::uuid as activated_by,
      nullif(to_jsonb(q)->>'activated_at', '')::timestamptz as activated_at,
      q.created_at,
      q.bulk_batch_id,
      count(*) over() as total_count
    from public.qr_codes q
    left join public.content_templates template_record
      on template_record.id = q.template_id
    left join public.profiles assigned_profile
      on assigned_profile.id = q.assigned_to
    left join public.profiles activated_profile
      on activated_profile.id = nullif(to_jsonb(q)->>'activated_by', '')::uuid
    left join public.profiles created_profile
      on created_profile.id = q.created_by
    where
      (
        v_filter = 'all'
        or (v_filter = 'pending' and q.activated = false)
        or (v_filter = 'redeemed' and q.activated = true)
        or (v_filter = 'open' and q.code_type = 'open')
        or (v_filter = 'locked' and q.code_type = 'locked')
        or (v_filter = 'templated' and q.template_id is not null)
        or (v_filter = 'batched' and q.bulk_batch_id is not null)
      )
      and (
        v_search = ''
        or lower(coalesce(q.code, '')) like '%' || v_search || '%'
        or lower(coalesce(q.scratch_code, '')) like '%' || v_search || '%'
        or lower(coalesce(q.label, '')) like '%' || v_search || '%'
        or lower(coalesce(q.code_type, '')) like '%' || v_search || '%'
        or lower(coalesce(q.assigned_email, '')) like '%' || v_search || '%'
        or lower(coalesce(q.id::text, '')) like '%' || v_search || '%'
        or lower(coalesce(q.template_id::text, '')) like '%' || v_search || '%'
        or lower(coalesce(q.assigned_to::text, '')) like '%' || v_search || '%'
        or lower(coalesce(q.created_by::text, '')) like '%' || v_search || '%'
        or lower(coalesce(q.bulk_batch_id::text, '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(q)->>'activated_by', '')) like '%' || v_search || '%'
        or lower(coalesce(q.created_at::text, '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(q)->>'activated_at', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(template_record)->>'name', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(assigned_profile)->>'email', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(assigned_profile)->>'full_name', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(assigned_profile)->>'username', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(activated_profile)->>'email', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(activated_profile)->>'full_name', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(activated_profile)->>'username', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(created_profile)->>'email', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(created_profile)->>'full_name', '')) like '%' || v_search || '%'
        or lower(coalesce(to_jsonb(created_profile)->>'username', '')) like '%' || v_search || '%'
        or case
          when q.activated = true then 'redeemed activated active'
          else 'pending unredeemed inactive'
        end like '%' || v_search || '%'
        or lower('/p/' || coalesce(q.code, '')) like '%' || v_search || '%'
        or lower('/activate/' || coalesce(q.code, '')) like '%' || v_search || '%'
        or (
          q.code is not null
          and length(q.code) > 0
          and v_normalized_search like '%' || lower(q.code) || '%'
        )
      )
  )
  select
    base.id,
    base.code,
    base.scratch_code,
    base.label,
    base.code_type,
    base.template_id,
    base.assigned_email,
    base.assigned_to,
    base.activated,
    base.is_active,
    base.created_by,
    base.activated_by,
    base.activated_at,
    base.created_at,
    base.bulk_batch_id,
    base.total_count
  from base
  order by
    case when v_sort_by = 'created_asc' then base.created_at end asc nulls last,
    case when v_sort_by = 'created_desc' then base.created_at end desc nulls last,
    case when v_sort_by = 'label_asc' then base.label end asc nulls last,
    case when v_sort_by = 'label_desc' then base.label end desc nulls last,
    case when v_sort_by = 'code_asc' then base.code end asc nulls last,
    case when v_sort_by = 'code_desc' then base.code end desc nulls last,
    base.created_at desc nulls last
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.admin_search_qr_codes(text, text, text, integer, integer) from public;
grant execute on function public.admin_search_qr_codes(text, text, text, integer, integer) to authenticated;



