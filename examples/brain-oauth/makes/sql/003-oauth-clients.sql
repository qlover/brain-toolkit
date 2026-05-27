-- Brain OAuth middleware schema (full recreate — safe to re-run in dev)
-- Drops existing brain_oauth_* tables (and legacy oauth_* names) then creates fresh objects.
-- Server writes use Supabase service role; RLS enabled with no public policies by default.

-- ---------------------------------------------------------------------------
-- Drop (children first, then clients; includes legacy unprefixed table names)
-- ---------------------------------------------------------------------------

drop table if exists public.brain_oauth_authorization_codes cascade;
drop table if exists public.brain_oauth_refresh_tokens cascade;
drop table if exists public.brain_oauth_user_credentials cascade;
drop table if exists public.brain_oauth_clients cascade;

drop table if exists public.oauth_authorization_codes cascade;
drop table if exists public.oauth_refresh_tokens cascade;
drop table if exists public.oauth_user_credentials cascade;
drop table if exists public.oauth_clients cascade;

-- ---------------------------------------------------------------------------
-- brain_oauth_clients — registered third-party OAuth 2.0 applications
-- ---------------------------------------------------------------------------

create table public.brain_oauth_clients (
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
  owner_user_id integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_brain_oauth_clients_owner on public.brain_oauth_clients (owner_user_id);

comment on table public.brain_oauth_clients is 'Registered OAuth 2.0 clients for Brain OAuth middleware.';

alter table public.brain_oauth_clients enable row level security;

-- ---------------------------------------------------------------------------
-- brain_oauth_authorization_codes — one-time authorization codes (5 min TTL)
-- ---------------------------------------------------------------------------

create table public.brain_oauth_authorization_codes (
  code text primary key,
  client_id text not null references public.brain_oauth_clients (client_id) on delete cascade,
  user_id integer not null,
  redirect_uri text not null,
  scope text,
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column public.brain_oauth_authorization_codes.code_challenge is 'PKCE code_challenge (RFC 7636), stored at authorization time.';
comment on column public.brain_oauth_authorization_codes.code_challenge_method is 'PKCE method; only S256 is supported.';
comment on column public.brain_oauth_clients.client_secret_hash is 'Null for public clients (PKCE-only, no client_secret).';

create index idx_brain_oauth_auth_codes_client on public.brain_oauth_authorization_codes (client_id);
create index idx_brain_oauth_auth_codes_expires on public.brain_oauth_authorization_codes (expires_at);

alter table public.brain_oauth_authorization_codes enable row level security;

-- ---------------------------------------------------------------------------
-- brain_oauth_refresh_tokens — middleware refresh_token → client/user mapping
-- ---------------------------------------------------------------------------

create table public.brain_oauth_refresh_tokens (
  id serial primary key,
  refresh_token text not null unique,
  client_id text not null references public.brain_oauth_clients (client_id) on delete cascade,
  user_id integer not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_brain_oauth_refresh_tokens_client_user on public.brain_oauth_refresh_tokens (client_id, user_id);

comment on column public.brain_oauth_refresh_tokens.refresh_token is 'Encrypted Brain refresh_token issued to the third-party client.';

alter table public.brain_oauth_refresh_tokens enable row level security;

-- ---------------------------------------------------------------------------
-- brain_oauth_user_credentials — long-lived Brain tokens per Brain user_id
-- ---------------------------------------------------------------------------

create table public.brain_oauth_user_credentials (
  user_id integer primary key,
  brain_refresh_token text,
  brain_session_token text,
  updated_at timestamptz not null default now()
);

comment on column public.brain_oauth_user_credentials.brain_refresh_token is 'Encrypted Brain refresh_token for long-lived user credentials.';

alter table public.brain_oauth_user_credentials enable row level security;
