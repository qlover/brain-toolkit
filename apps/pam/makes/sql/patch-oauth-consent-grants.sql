-- Existing DBs: remembered OAuth consent ("trust this app" on one device).
-- Keep in sync with 000-pam-full-schema.sql and shared/config/pamTables.ts
-- Recreates the table: earlier drafts had no device_id, and trust rows are
-- safe to drop (users just see the consent page once more).

drop table if exists public.pam_oauth_consent_grants cascade;

create table public.pam_oauth_consent_grants (
  user_id text not null,
  client_id text not null references public.pam_oauth_clients (client_id) on delete cascade,
  device_id text not null,
  scopes text[] not null default '{}',
  user_agent text,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, client_id, device_id)
);

create index idx_pam_oauth_consent_grants_user on public.pam_oauth_consent_grants (user_id);

comment on table public.pam_oauth_consent_grants is 'Remembered consent ("trust this app") per user + client + device; skip the authorize page for these scopes until expires_at.';
comment on column public.pam_oauth_consent_grants.device_id is 'Random id from the httpOnly pam_oauth_device cookie.';

alter table public.pam_oauth_consent_grants enable row level security;
