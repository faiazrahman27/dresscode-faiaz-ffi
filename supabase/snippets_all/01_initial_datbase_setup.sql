-- ============================================
-- DRESSCODE - INITIAL DATABASE SETUP
-- ============================================

-- Extensions
create extension if not exists pgcrypto;

-- ============================================
-- HELPER FUNCTION: updated_at trigger
-- ============================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================
-- PROFILES
-- Links to auth.users
-- NOTE: per guide, profiles is the special table used for app-level identity
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  bio text,
  avatar text,
  role text not null default 'user'
    check (role in ('user', 'journalist', 'admin')),
  accent_color text not null default '#5ECFCF',
  instagram text,
  linkedin text,
  twitter text,
  youtube text,
  tiktok text,
  discord text,
  facebook text,
  spotify text,
  github text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ============================================
-- CONTENT TEMPLATES
-- Used for locked codes
-- ============================================
create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  page_data jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- QR CODES
-- Core ownership/activation object
-- ============================================
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  scratch_code text not null unique,
  label text,
  code_type text not null default 'open'
    check (code_type in ('open', 'locked')),
  activated boolean not null default false,
  activated_by uuid references public.profiles(id) on delete set null,
  activated_at timestamptz,
  redeemed_by uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  template_id uuid references public.content_templates(id) on delete set null,
  constraint activated_consistency check (
    (activated = false and activated_at is null)
    or
    (activated = true and activated_at is not null)
  )
);

create index if not exists idx_qr_codes_created_at on public.qr_codes(created_at desc);
create index if not exists idx_qr_codes_activated_by on public.qr_codes(activated_by);
create index if not exists idx_qr_codes_assigned_to on public.qr_codes(assigned_to);
create index if not exists idx_qr_codes_template_id on public.qr_codes(template_id);

-- ============================================
-- CODE PROFILES
-- One editable profile per qr code
-- ============================================
create table if not exists public.code_profiles (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null unique references public.qr_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text,
  bio text,
  avatar_url text,
  accent text default '#5ECFCF',
  page_data jsonb not null default '{
    "version": 1,
    "settings": {
      "accentColor": "#5ECFCF",
      "background": {
        "type": "color",
        "value": "#0A1F1F"
      },
      "redirectUrl": ""
    },
    "navbar": {
      "enabled": false,
      "brandText": "",
      "links": []
    },
    "sections": []
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_code_profiles_user_id on public.code_profiles(user_id);

drop trigger if exists trg_code_profiles_updated_at on public.code_profiles;
create trigger trg_code_profiles_updated_at
before update on public.code_profiles
for each row
execute function public.set_updated_at();

-- ============================================
-- ARTICLES
-- ============================================
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  tag text,
  excerpt text,
  content text not null default '',
  date date,
  read_time text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_articles_author_id on public.articles(author_id);
create index if not exists idx_articles_published on public.articles(published);
create index if not exists idx_articles_date on public.articles(date desc);

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
before update on public.articles
for each row
execute function public.set_updated_at();

-- ============================================
-- SCANS
-- ============================================
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  device text,
  scanned_at timestamptz not null default now(),
  country text,
  city text
);

create index if not exists idx_scans_qr_code_id on public.scans(qr_code_id);
create index if not exists idx_scans_scanned_at on public.scans(scanned_at desc);

-- ============================================
-- NEWSLETTER
-- ============================================
create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================
-- CONTACTS
-- ============================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  organization text,
  interest text check (interest in ('pilot', 'partner', 'developer', 'investor', 'other')),
  message text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- PENDING ASSIGNMENTS
-- ============================================
create table if not exists public.pending_assignments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('user', 'journalist', 'admin')),
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pending_assignments_email on public.pending_assignments(email);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- Copies auth.users data into public.profiles
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();