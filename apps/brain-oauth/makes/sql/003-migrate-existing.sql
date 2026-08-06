-- Migrate an EXISTING brain-oauth DB (older 002) to current schema.
-- Fresh installs: only run 001 + 002 — skip this file.
--
-- Does in one pass:
--   1) user_id / owner_user_id → text (if still integer)
--   2) create/upgrade brain_oauth_user_links (provider, external_user_id, extra)
--   3) remap OAuth rows external id → auth.users UUID when links already exist
--
-- If you still have Brain-id owners and no links yet: run
--   makes/scripts/migrate-brain-user-ids.ts
-- then re-run THIS file (step 3 is idempotent).

-- ---------------------------------------------------------------------------
-- 1) integer → text
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_clients'
      and column_name = 'owner_user_id' and data_type <> 'text'
  ) then
    alter table public.brain_oauth_clients
      alter column owner_user_id type text using owner_user_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_authorization_codes'
      and column_name = 'user_id' and data_type <> 'text'
  ) then
    alter table public.brain_oauth_authorization_codes
      alter column user_id type text using user_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_refresh_tokens'
      and column_name = 'user_id' and data_type <> 'text'
  ) then
    alter table public.brain_oauth_refresh_tokens
      alter column user_id type text using user_id::text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_user_credentials'
      and column_name = 'user_id' and data_type <> 'text'
  ) then
    alter table public.brain_oauth_user_credentials
      alter column user_id type text using user_id::text;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) brain_oauth_user_links (create or upgrade columns)
-- ---------------------------------------------------------------------------

create table if not exists public.brain_oauth_user_links (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null default 'brain',
  external_user_id text not null,
  extra jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_user_id)
);

do $$
begin
  -- legacy: brain_user_id → external_user_id
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

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_user_links'
      and column_name = 'provider'
  ) then
    alter table public.brain_oauth_user_links
      add column provider text not null default 'brain';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brain_oauth_user_links'
      and column_name = 'extra'
  ) then
    alter table public.brain_oauth_user_links
      add column extra jsonb;
  end if;
end $$;

create index if not exists idx_brain_oauth_user_links_external
  on public.brain_oauth_user_links (provider, external_user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brain_oauth_user_links_provider_external_user_id_key'
  ) then
    alter table public.brain_oauth_user_links
      add constraint brain_oauth_user_links_provider_external_user_id_key
      unique (provider, external_user_id);
  end if;
exception
  when unique_violation then
    raise notice 'brain_oauth_user_links already has duplicate (provider, external_user_id); skip UNIQUE';
end $$;

comment on table public.brain_oauth_user_links is
  'Maps upstream IdP user ids to local auth.users ids; optional extra profile JSON.';

alter table public.brain_oauth_user_links enable row level security;

-- ---------------------------------------------------------------------------
-- 3) remap external id → auth UUID (no-op until links are populated)
-- ---------------------------------------------------------------------------

update public.brain_oauth_clients c
set
  owner_user_id = l.auth_user_id::text,
  updated_at = now()
from public.brain_oauth_user_links l
where l.provider = 'brain'
  and c.owner_user_id = l.external_user_id
  and c.owner_user_id <> l.auth_user_id::text;

update public.brain_oauth_authorization_codes a
set user_id = l.auth_user_id::text
from public.brain_oauth_user_links l
where l.provider = 'brain'
  and a.user_id = l.external_user_id
  and a.user_id <> l.auth_user_id::text;

update public.brain_oauth_refresh_tokens r
set user_id = l.auth_user_id::text
from public.brain_oauth_user_links l
where l.provider = 'brain'
  and r.user_id = l.external_user_id
  and r.user_id <> l.auth_user_id::text;

-- Prefer existing UUID credential rows (do not overwrite fresher tokens).
insert into public.brain_oauth_user_credentials (
  user_id,
  provider_refresh_token,
  provider_session_token,
  updated_at
)
select
  l.auth_user_id::text,
  c.provider_refresh_token,
  c.provider_session_token,
  now()
from public.brain_oauth_user_credentials c
join public.brain_oauth_user_links l
  on l.provider = 'brain' and c.user_id = l.external_user_id
where c.user_id <> l.auth_user_id::text
on conflict (user_id) do nothing;

delete from public.brain_oauth_user_credentials c
using public.brain_oauth_user_links l
where l.provider = 'brain'
  and c.user_id = l.external_user_id
  and c.user_id <> l.auth_user_id::text;
