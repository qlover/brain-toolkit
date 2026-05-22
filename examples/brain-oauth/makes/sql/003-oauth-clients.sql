-- OAuth client registration (third-party apps)

create table public.oauth_clients (
  id serial primary key,
  client_id text unique not null,
  client_secret_hash text not null,
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

create index idx_oauth_clients_owner on public.oauth_clients (owner_user_id);

comment on table public.oauth_clients is 'Registered OAuth 2.0 clients for Brain OAuth middleware.';

alter table public.oauth_clients enable row level security;

-- Server uses service role for OAuth operations; no public policies by default.

-- Authorization codes, refresh token mapping, and Brain user credentials

create table public.oauth_authorization_codes (
  code text primary key,
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id integer not null,
  redirect_uri text not null,
  scope text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_oauth_auth_codes_client on public.oauth_authorization_codes (client_id);
create index idx_oauth_auth_codes_expires on public.oauth_authorization_codes (expires_at);

create table public.oauth_refresh_tokens (
  id serial primary key,
  refresh_token text not null unique,
  client_id text not null references public.oauth_clients (client_id) on delete cascade,
  user_id integer not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_oauth_refresh_tokens_client_user on public.oauth_refresh_tokens (client_id, user_id);

create table public.oauth_user_credentials (
  user_id integer primary key,
  brain_refresh_token text,
  brain_session_token text,
  updated_at timestamptz not null default now()
);

comment on column public.oauth_refresh_tokens.refresh_token is 'Encrypted Brain refresh_token issued to the third-party client.';
comment on column public.oauth_user_credentials.brain_refresh_token is 'Encrypted Brain refresh_token for long-lived user credentials.';

alter table public.oauth_authorization_codes enable row level security;
alter table public.oauth_refresh_tokens enable row level security;
alter table public.oauth_user_credentials enable row level security;
