-- =============================================================================
-- brain-oauth schema (single script)
--
-- Only touches brain_oauth_* tables. Never drops tables; safe to re-run.
--   - Fresh DB: creates everything.
--   - Existing DB: upgrades in place (integer ids → text, users moved off
--     auth.users into brain_oauth_users with the same UUIDs).
--
-- brain-oauth does not use Supabase Auth. All access goes through the server
-- (service role); RLS is enabled with no policies so anon keys see nothing.
-- =============================================================================


-- #############################################################################
-- 1) Users + IdP links
-- #############################################################################

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

-- Existing DB: links keyed by auth_user_id (→ auth.users). Copy those users
-- into brain_oauth_users, then repoint the column.
do $$
declare
  fk record;
  orphan_count integer;
begin
  if to_regclass('public.brain_oauth_user_links') is null then
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_user_links'
      and column_name = 'brain_user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_user_links'
      and column_name = 'external_user_id'
  ) then
    alter table public.brain_oauth_user_links
      rename column brain_user_id to external_user_id;
  end if;

  alter table public.brain_oauth_user_links
    add column if not exists provider text not null default 'brain';
  alter table public.brain_oauth_user_links
    add column if not exists extra jsonb;

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

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.brain_oauth_user_links'::regclass and contype = 'u'
  ) then
    alter table public.brain_oauth_user_links
      add constraint brain_oauth_user_links_provider_external_user_id_key
      unique (provider, external_user_id);
  end if;
end $$;

create index if not exists idx_brain_oauth_user_links_external
  on public.brain_oauth_user_links (provider, external_user_id);

comment on table public.brain_oauth_user_links is
  'Maps upstream IdP user ids to brain_oauth_users ids; optional extra profile JSON.';

alter table public.brain_oauth_user_links enable row level security;


-- #############################################################################
-- 2) OAuth clients, codes, tokens, credentials
-- #############################################################################

create table if not exists public.brain_oauth_clients (
  id serial primary key,
  client_id text unique not null,
  client_secret_hash text,
  client_name text not null,
  client_uri text,
  logo_uri text,
  redirect_uris text[] not null,
  grant_types text[] not null default '{authorization_code,refresh_token}',
  scopes text[] not null default '{openid,profile,email}',
  confidential boolean not null default true,
  owner_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brain_oauth_clients_owner
  on public.brain_oauth_clients (owner_user_id);

comment on table public.brain_oauth_clients is 'Registered OAuth 2.0 clients for Brain OAuth middleware.';
comment on column public.brain_oauth_clients.client_secret_hash is 'Null for public clients (PKCE-only, no client_secret).';

alter table public.brain_oauth_clients enable row level security;

create table if not exists public.brain_oauth_authorization_codes (
  code text primary key,
  client_id text not null references public.brain_oauth_clients (client_id) on delete cascade,
  user_id text not null,
  redirect_uri text not null,
  scope text,
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_brain_oauth_auth_codes_client
  on public.brain_oauth_authorization_codes (client_id);
create index if not exists idx_brain_oauth_auth_codes_expires
  on public.brain_oauth_authorization_codes (expires_at);

comment on column public.brain_oauth_authorization_codes.code_challenge is 'PKCE code_challenge (RFC 7636), stored at authorization time.';
comment on column public.brain_oauth_authorization_codes.code_challenge_method is 'PKCE method; only S256 is supported.';

alter table public.brain_oauth_authorization_codes enable row level security;

create table if not exists public.brain_oauth_refresh_tokens (
  id serial primary key,
  refresh_token text not null unique,
  client_id text not null references public.brain_oauth_clients (client_id) on delete cascade,
  user_id text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_brain_oauth_refresh_tokens_client_user
  on public.brain_oauth_refresh_tokens (client_id, user_id);

comment on column public.brain_oauth_refresh_tokens.refresh_token is 'Encrypted Brain refresh_token issued to the third-party client.';

alter table public.brain_oauth_refresh_tokens enable row level security;

create table if not exists public.brain_oauth_user_credentials (
  user_id text primary key,
  provider_refresh_token text,
  provider_session_token text,
  updated_at timestamptz not null default now()
);

comment on column public.brain_oauth_user_credentials.user_id is
  'Local brain_oauth_users.id (UUID text), not Brain API id.';
comment on column public.brain_oauth_user_credentials.provider_refresh_token is
  'Encrypted Brain refresh_token for long-lived user credentials.';

alter table public.brain_oauth_user_credentials enable row level security;

-- Existing DB: legacy integer user ids → text.
do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('brain_oauth_clients', 'owner_user_id'),
      ('brain_oauth_authorization_codes', 'user_id'),
      ('brain_oauth_refresh_tokens', 'user_id'),
      ('brain_oauth_user_credentials', 'user_id')
    ) as t(table_name, column_name)
  loop
    if exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = target.table_name
        and c.column_name = target.column_name and c.data_type <> 'text'
    ) then
      execute format(
        'alter table public.%I alter column %I type text using %I::text',
        target.table_name, target.column_name, target.column_name
      );
    end if;
  end loop;
end $$;

-- Existing DB: rows still owned by a Brain API id → local user id.
-- No-op once remapped (only matches rows whose id equals an external id).
update public.brain_oauth_clients c
set owner_user_id = l.user_id::text, updated_at = now()
from public.brain_oauth_user_links l
where l.provider = 'brain'
  and c.owner_user_id = l.external_user_id
  and c.owner_user_id <> l.user_id::text;

update public.brain_oauth_authorization_codes a
set user_id = l.user_id::text
from public.brain_oauth_user_links l
where l.provider = 'brain'
  and a.user_id = l.external_user_id
  and a.user_id <> l.user_id::text;

update public.brain_oauth_refresh_tokens r
set user_id = l.user_id::text
from public.brain_oauth_user_links l
where l.provider = 'brain'
  and r.user_id = l.external_user_id
  and r.user_id <> l.user_id::text;

insert into public.brain_oauth_user_credentials (
  user_id, provider_refresh_token, provider_session_token, updated_at
)
select l.user_id::text, c.provider_refresh_token, c.provider_session_token, now()
from public.brain_oauth_user_credentials c
join public.brain_oauth_user_links l
  on l.provider = 'brain' and c.user_id = l.external_user_id
where c.user_id <> l.user_id::text
on conflict (user_id) do nothing;

delete from public.brain_oauth_user_credentials c
using public.brain_oauth_user_links l
where l.provider = 'brain'
  and c.user_id = l.external_user_id
  and c.user_id <> l.user_id::text;


-- #############################################################################
-- 3) Request / auth log
-- #############################################################################
-- The legacy public.request_logs table is not touched (not brain-oauth only).

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
  'Append-only API / auth log. Server-only; user_id = brain_oauth_users.id, filtered by the app.';
comment on column public.brain_oauth_request_logs.event_category is 'High-level group, e.g. api, auth, system.';
comment on column public.brain_oauth_request_logs.event_type is 'Concrete event, e.g. http.request, login, logout.';
comment on column public.brain_oauth_request_logs.request_id is 'Optional correlation id for an API/request lifecycle; auth-only rows may be null.';
comment on column public.brain_oauth_request_logs.payload is 'Event-specific context: HTTP fields, IP, errors, auth_provider, etc.';

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


-- #############################################################################
-- 4) Remembered OAuth consent ("trust this app on this device")
-- #############################################################################

create table if not exists public.brain_oauth_consent_grants (
  user_id text not null,
  client_id text not null references public.brain_oauth_clients (client_id) on delete cascade,
  device_id text not null,
  scopes text[] not null default '{}',
  user_agent text,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, client_id, device_id)
);

create index if not exists idx_brain_oauth_consent_grants_user
  on public.brain_oauth_consent_grants (user_id);

comment on table public.brain_oauth_consent_grants is
  'Per user + client + device consent; authorize skips the consent page while active.';
comment on column public.brain_oauth_consent_grants.user_id is
  'Local brain_oauth_users.id (UUID text).';
comment on column public.brain_oauth_consent_grants.device_id is
  'Random id from the httpOnly brain_oauth_device cookie.';

alter table public.brain_oauth_consent_grants enable row level security;
