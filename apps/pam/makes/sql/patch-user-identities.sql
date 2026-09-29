-- Existing DBs: external login identities (Brain OAuth sub -> PAM user).
-- Keep in sync with 000-pam-full-schema.sql and shared/config/pamTables.ts
--
-- Before this table, PAM stored the brain-oauth `sub` directly as pam_users.id,
-- which only worked while brain-oauth created its users in the same auth.users.
-- Run this BEFORE brain-oauth moves to its own user table.

create table if not exists public.pam_user_identities (
  provider text not null,
  external_user_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  primary key (provider, external_user_id)
);

create index if not exists idx_pam_user_identities_user
  on public.pam_user_identities (user_id);

comment on table public.pam_user_identities is
  'External login identities mapped to a PAM user (provider = brain: external_user_id is the brain-oauth sub).';

alter table public.pam_user_identities enable row level security;

-- Backfill: existing Brain PKCE users have pam_users.id = brain-oauth sub.
do $$
begin
  if to_regclass('public.brain_oauth_user_links') is not null then
    insert into public.pam_user_identities (provider, external_user_id, user_id)
    select distinct 'brain', p.id::text, p.id
    from public.pam_users p
    join public.brain_oauth_user_links l on l.auth_user_id = p.id
    on conflict (provider, external_user_id) do nothing;
  end if;
end $$;
