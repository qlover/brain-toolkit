-- brain-oauth owns its users: brain_oauth_users replaces auth.users (no Supabase Auth).
-- Idempotent — safe to re-run.
--
-- Existing DB (links still keyed by auth_user_id):
--   1) copy linked auth.users rows into brain_oauth_users (same UUIDs, emails lowercased)
--   2) links: drop FK to auth.users, rename auth_user_id → user_id, FK → brain_oauth_users
-- Fresh DB (new 001 + 002): tables already exist; this file is a no-op.
--
-- Request logs now live in brain_oauth_request_logs (created below if missing).
-- The legacy public.request_logs table is NOT touched (it may belong to another
-- app in a shared project). To keep old brain-oauth logs, copy them manually:
--   insert into public.brain_oauth_request_logs select * from public.request_logs;

-- ---------------------------------------------------------------------------
-- brain_oauth_users
-- ---------------------------------------------------------------------------

create table if not exists public.brain_oauth_users (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  name text,
  extra jsonb,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists brain_oauth_users_email_key
  on public.brain_oauth_users (lower(email))
  where email is not null;

comment on table public.brain_oauth_users is
  'Local brain-oauth users (session / owner ids). Emails stored lowercased; may be synthetic.';

alter table public.brain_oauth_users enable row level security;

-- ---------------------------------------------------------------------------
-- Migrate links from auth.users
-- ---------------------------------------------------------------------------

do $$
declare
  fk record;
  orphan_count integer;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_user_links'
      and column_name = 'auth_user_id'
  ) then
    return;
  end if;

  insert into public.brain_oauth_users (
    id, email, phone, name, extra, created_at, updated_at
  )
  select
    u.id,
    lower(u.email),
    nullif(u.phone, ''),
    coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
    coalesce(l.extra, u.raw_user_meta_data -> 'extra'),
    u.created_at,
    now()
  from public.brain_oauth_user_links l
  join auth.users u on u.id = l.auth_user_id
  on conflict do nothing;

  select count(*) into orphan_count
  from public.brain_oauth_user_links l
  where not exists (
    select 1 from public.brain_oauth_users u where u.id = l.auth_user_id
  );
  if orphan_count > 0 then
    raise exception
      '% brain_oauth_user_links rows could not be copied (duplicate email ignoring case?). Resolve and re-run.',
      orphan_count;
  end if;

  for fk in
    select conname from pg_constraint
    where conrelid = 'public.brain_oauth_user_links'::regclass and contype = 'f'
  loop
    execute format(
      'alter table public.brain_oauth_user_links drop constraint %I',
      fk.conname
    );
  end loop;

  alter table public.brain_oauth_user_links
    rename column auth_user_id to user_id;
end $$;

-- ---------------------------------------------------------------------------
-- brain_oauth_user_links (create if missing; ensure FK → brain_oauth_users)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_oauth_user_links (
  user_id uuid primary key references public.brain_oauth_users (id) on delete cascade,
  provider text not null default 'brain',
  external_user_id text not null,
  extra jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_user_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.brain_oauth_user_links'::regclass and contype = 'f'
  ) then
    alter table public.brain_oauth_user_links
      add constraint brain_oauth_user_links_user_id_fkey
      foreign key (user_id) references public.brain_oauth_users (id) on delete cascade;
  end if;
end $$;

create index if not exists idx_brain_oauth_user_links_external
  on public.brain_oauth_user_links (provider, external_user_id);

comment on table public.brain_oauth_user_links is
  'Maps upstream IdP user ids to brain_oauth_users ids; optional extra profile JSON.';

alter table public.brain_oauth_user_links enable row level security;

-- ---------------------------------------------------------------------------
-- brain_oauth_request_logs
-- ---------------------------------------------------------------------------

create table if not exists public.brain_oauth_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_category text not null,
  event_type text not null,
  success boolean not null default true,
  request_id uuid,
  record_type text,
  payload jsonb
);

comment on table public.brain_oauth_request_logs is
  'Append-only API / auth log. Server-only (service role); user_id = brain_oauth_users.id, filtered by the app.';

create index if not exists idx_brain_oauth_request_logs_user_id
  on public.brain_oauth_request_logs (user_id);
create index if not exists idx_brain_oauth_request_logs_created_at
  on public.brain_oauth_request_logs (created_at desc);
create index if not exists idx_brain_oauth_request_logs_category
  on public.brain_oauth_request_logs (event_category);
create index if not exists idx_brain_oauth_request_logs_event_type
  on public.brain_oauth_request_logs (event_type);
create index if not exists idx_brain_oauth_request_logs_request_id
  on public.brain_oauth_request_logs (request_id);

alter table public.brain_oauth_request_logs enable row level security;
