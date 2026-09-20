-- =============================================================================
-- PAM full schema (single script, safe to re-run in DEV)
-- Prefix: pam_ (incl. pam_oauth_* / pam_request_logs / pam_cli_tokens)
-- Request audit table: pam_request_logs (NOT request_logs / fe_request_logs)
-- Keep permission_key seeds in sync with apps/pam/shared/auth/permissionKeys.ts
-- =============================================================================

-- Drop legacy audit table names that collide with next-oauth / older PAM
DROP TABLE IF EXISTS public.pam_request_logs CASCADE;
DROP TABLE IF EXISTS public.request_logs CASCADE;
DROP TABLE IF EXISTS public.fe_request_logs CASCADE;


-- #############################################################################
-- SOURCE: 001-base-tables.sql
-- #############################################################################

-- Unified request / operation log (API calls, auth events, etc.) with user-scoped RLS (Supabase / Postgres)

create table public.pam_request_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_category text not null,
  event_type text not null,
  success boolean not null default true,
  request_id uuid,
  record_type text,
  payload jsonb
);

comment on table public.pam_request_logs is 'Append-only log for HTTP API traffic, auth actions, and other server-side events; RLS limits reads to own user_id rows.';

comment on column public.pam_request_logs.created_at is 'Row insert time (event recorded at).';
comment on column public.pam_request_logs.updated_at is 'Last update time; append-only rows typically match created_at.';
comment on column public.pam_request_logs.event_category is 'High-level group, e.g. api, auth, system.';
comment on column public.pam_request_logs.event_type is 'Concrete event, e.g. http.request, login, logout.';
comment on column public.pam_request_logs.request_id is 'Optional correlation id for an API/request lifecycle (e.g. AppApiResult.requestId); auth-only rows may be null.';
comment on column public.pam_request_logs.record_type is 'Optional log record kind (e.g. demo-oauth for OAuth-related traffic in this app); null when unspecified.';
comment on column public.pam_request_logs.payload is 'Event-specific context: HTTP fields, IP, errors, correlation_id, auth_provider, etc.';

create index idx_pam_request_logs_user_id on public.pam_request_logs (user_id);
create index idx_pam_request_logs_created_at on public.pam_request_logs (created_at desc);
create index idx_pam_request_logs_category on public.pam_request_logs (event_category);
create index idx_pam_request_logs_event_type on public.pam_request_logs (event_type);
create index idx_pam_request_logs_request_id on public.pam_request_logs (request_id);

alter table public.pam_request_logs enable row level security;

-- Signed-in users read only their own rows (anonymous-only rows are not visible via RLS)
create policy "pam_request_logs_select_own" on public.pam_request_logs
  for select
  using (user_id is not null and auth.uid() = user_id);

-- Inserts must be self-attributed or anonymous (no forging another user)
create policy "pam_request_logs_insert_self_or_anon" on public.pam_request_logs
  for insert
  with check (user_id is null or auth.uid() = user_id);

-- No update/delete: append-only (service role bypasses RLS if needed)


-- #############################################################################
-- SOURCE: 002-oauth-clients.sql
-- #############################################################################

-- Next OAuth Wrapper middleware schema (full recreate — safe to re-run in dev)
-- Drops existing pam_oauth_* (and legacy n_oauth_wrapper__*) then creates fresh objects.
-- OAuth tables below optionally enable RLS (see end of file). Without RLS, server can use SUPABASE_ANON_KEY; with RLS and no anon policies, use service role or add policies.

-- ---------------------------------------------------------------------------
-- Drop (children first, then clients; includes legacy unprefixed table names)
-- ---------------------------------------------------------------------------

drop table if exists public.pam_oauth_authorization_codes cascade;
drop table if exists public.pam_oauth_refresh_tokens cascade;
drop table if exists public.pam_oauth_user_credentials cascade;
drop table if exists public.pam_oauth_clients cascade;
-- Legacy names (pre pam_oauth_* rename)
drop table if exists public.n_oauth_wrapper__authorization_codes cascade;
drop table if exists public.n_oauth_wrapper__refresh_tokens cascade;
drop table if exists public.n_oauth_wrapper__user_credentials cascade;
drop table if exists public.n_oauth_wrapper__clients cascade;

-- ---------------------------------------------------------------------------
-- pam_oauth_clients — registered third-party OAuth 2.0 applications
-- ---------------------------------------------------------------------------

create table public.pam_oauth_clients (
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

create index idx_pam_oauth_clients_owner on public.pam_oauth_clients (owner_user_id);

comment on table public.pam_oauth_clients is 'Registered OAuth 2.0 clients for Next OAuth Wrapper middleware.';

alter table public.pam_oauth_clients enable row level security;

-- ---------------------------------------------------------------------------
-- pam_oauth_authorization_codes — one-time authorization codes (5 min TTL)
-- ---------------------------------------------------------------------------

create table public.pam_oauth_authorization_codes (
  code text primary key,
  client_id text not null references public.pam_oauth_clients (client_id) on delete cascade,
  user_id text not null,
  redirect_uri text not null,
  scope text,
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column public.pam_oauth_authorization_codes.code_challenge is 'PKCE code_challenge (RFC 7636), stored at authorization time.';
comment on column public.pam_oauth_authorization_codes.code_challenge_method is 'PKCE method; only S256 is supported.';
comment on column public.pam_oauth_clients.client_secret_hash is 'Null for public clients (PKCE-only, no client_secret).';

create index idx_pam_oauth_auth_codes_client on public.pam_oauth_authorization_codes (client_id);
create index idx_pam_oauth_auth_codes_expires on public.pam_oauth_authorization_codes (expires_at);

alter table public.pam_oauth_authorization_codes enable row level security;

-- ---------------------------------------------------------------------------
-- pam_oauth_refresh_tokens — middleware refresh_token → client/user mapping
-- ---------------------------------------------------------------------------

create table public.pam_oauth_refresh_tokens (
  id serial primary key,
  refresh_token text not null unique,
  client_id text not null references public.pam_oauth_clients (client_id) on delete cascade,
  user_id text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_pam_oauth_refresh_tokens_client_user on public.pam_oauth_refresh_tokens (client_id, user_id);

comment on column public.pam_oauth_refresh_tokens.refresh_token is 'Hashed middleware refresh_token issued to the third-party client.';

alter table public.pam_oauth_refresh_tokens enable row level security;

-- ---------------------------------------------------------------------------
-- pam_oauth_user_credentials — long-lived upstream provider tokens per user_id
-- ---------------------------------------------------------------------------

create table public.pam_oauth_user_credentials (
  user_id text primary key,
  provider_refresh_token text,
  provider_session_token text,
  updated_at timestamptz not null default now()
);

comment on column public.pam_oauth_user_credentials.provider_refresh_token is 'Encrypted upstream provider refresh_token for long-lived user credentials.';

alter table public.pam_oauth_user_credentials enable row level security;


-- #############################################################################
-- SOURCE: 003-pam-base.sql
-- #############################################################################

-- ============================================================
-- 1. 删除旧表（谨慎！）
-- ============================================================
DROP TABLE IF EXISTS pam_environments CASCADE;
DROP TABLE IF EXISTS pam_projects CASCADE;

-- ============================================================
-- 2. 创建项目表
-- ============================================================
CREATE TABLE pam_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    stack TEXT,
    repo_url TEXT,
    category TEXT,
    is_public INT NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
    is_deleted INT NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
    create_source INT NOT NULL DEFAULT 0 CHECK (create_source IN (0, 1, 2)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. 创建环境表
-- ============================================================
CREATE TABLE pam_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pam_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT,
    variables JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

-- ============================================================
-- 4. 索引
-- ============================================================
CREATE INDEX idx_pam_projects_owner_id ON pam_projects(owner_id);
CREATE INDEX idx_pam_projects_visibility ON pam_projects(is_public);
CREATE INDEX idx_pam_projects_category ON pam_projects(category);
CREATE INDEX idx_pam_projects_slug ON pam_projects(slug);
-- Active projects only: soft-deleted rows release the slug for reuse.
CREATE UNIQUE INDEX idx_pam_projects_slug_active
  ON pam_projects (slug)
  WHERE is_deleted = 0;
CREATE INDEX idx_pam_environments_project_id ON pam_environments(project_id);

-- ============================================================
-- 5. 自动更新时间戳函数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pam_projects_updated_at
BEFORE UPDATE ON pam_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pam_environments_updated_at
BEFORE UPDATE ON pam_environments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 启用 RLS
-- ============================================================
ALTER TABLE pam_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pam_environments ENABLE ROW LEVEL SECURITY;

-- 为了测试方便，先创建宽松的 RLS（可后续调整）
CREATE POLICY "Select pam_projects" ON pam_projects
FOR SELECT
USING (is_public = 1 OR owner_id = auth.uid());

CREATE POLICY "Insert pam_projects" ON pam_projects
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Update pam_projects" ON pam_projects
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Delete pam_projects" ON pam_projects
FOR DELETE
USING (auth.uid() = owner_id);

-- 环境策略
CREATE POLICY "Select pam_environments" ON pam_environments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND (pam_projects.is_public = 1 OR pam_projects.owner_id = auth.uid())
    )
);

CREATE POLICY "Insert pam_environments" ON pam_environments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);

CREATE POLICY "Update pam_environments" ON pam_environments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);

CREATE POLICY "Delete pam_environments" ON pam_environments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);


-- #############################################################################
-- SOURCE: 004-update_project_with_environments.sql
-- #############################################################################

CREATE OR REPLACE FUNCTION update_project_with_environments(
  p_project_id UUID,
  p_updates JSONB,
  p_environments JSONB DEFAULT NULL,
  p_remove_missing BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner_id UUID;
  v_env_record RECORD;
  v_result JSONB;
BEGIN
  -- 1. 锁定并验证所有权
  SELECT owner_id INTO v_owner_id
  FROM pam_projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project % not found', p_project_id;
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: not the owner';
  END IF;

  -- 2. 更新项目字段（显式列出允许的字段，避免注入）
  IF p_updates IS NOT NULL AND jsonb_typeof(p_updates) = 'object' AND p_updates <> '{}'::jsonb THEN
    IF p_updates ? 'owner_id' OR p_updates ? 'id' THEN
      RAISE EXCEPTION 'Cannot update id or owner_id';
    END IF;

    UPDATE pam_projects
    SET
      name = COALESCE((p_updates->>'name')::text, name),
      description = COALESCE((p_updates->>'description')::text, description),
      stack = COALESCE((p_updates->>'stack')::text, stack),
      repo_url = COALESCE((p_updates->>'repo_url')::text, repo_url),
      preview_image_url = COALESCE((p_updates->>'preview_image_url')::text, preview_image_url),
      category = COALESCE((p_updates->>'category')::text, category),
      is_public = COALESCE((p_updates->>'is_public')::int, is_public),
      updated_at = now()
    WHERE id = p_project_id;
  END IF;

  -- 3. 处理环境 UPSERT
  IF p_environments IS NOT NULL AND jsonb_typeof(p_environments) = 'array' THEN
    FOR v_env_record IN 
      SELECT id, name, url, variables
      FROM jsonb_to_recordset(p_environments) AS x(id UUID, name TEXT, url TEXT, variables JSONB)
    LOOP
      INSERT INTO pam_environments (id, project_id, name, url, variables)
      VALUES (
        COALESCE(v_env_record.id, gen_random_uuid()),
        p_project_id,
        v_env_record.name,
        v_env_record.url,
        COALESCE(v_env_record.variables, '{}'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        variables = EXCLUDED.variables,
        updated_at = now();
    END LOOP;
  END IF;

  -- 4. 可选删除缺失的环境
  IF p_remove_missing AND p_environments IS NOT NULL THEN
    DELETE FROM pam_environments
    WHERE project_id = p_project_id
    AND id NOT IN (
      SELECT id FROM jsonb_to_recordset(p_environments) AS x(id UUID) WHERE id IS NOT NULL
    );
  END IF;

  -- 5. 返回最新数据
  SELECT jsonb_build_object(
    'project', row_to_json(p),
    'environments', COALESCE(
      (SELECT jsonb_agg(row_to_json(e)) FROM pam_environments e WHERE e.project_id = p_project_id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM pam_projects p
  WHERE p.id = p_project_id;

  RETURN v_result;
END;
$$;

-- #############################################################################
-- SOURCE: 005-pam-cli-tokens.sql
-- #############################################################################

-- PAM CLI bearer token registry (jti allowlist / revoke)
-- Apply after 004-*. Existing 30d JWTs without jti will stop working after deploy (re-login).

drop table if exists public.pam_cli_tokens cascade;
drop table if exists public.n_pam_cli_tokens cascade;

create table public.pam_cli_tokens (
  id uuid primary key default gen_random_uuid(),
  jti text not null unique,
  user_id text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  revoked_at timestamptz,
  login_method text,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_pam_cli_tokens_user
  on public.pam_cli_tokens (user_id);

create index idx_pam_cli_tokens_active
  on public.pam_cli_tokens (jti, revoked, expires_at);

comment on table public.pam_cli_tokens is
  'Issued PAM CLI JWTs by jti; revoke on logout or admin wipe.';

alter table public.pam_cli_tokens enable row level security;


-- #############################################################################
-- SOURCE: 008-pam-preview-image.sql
-- #############################################################################

ALTER TABLE pam_projects
  ADD COLUMN IF NOT EXISTS preview_image_url text;

COMMENT ON COLUMN pam_projects.preview_image_url IS
  'Optional public URL for project cover / first-screen preview image';

-- Lookup Auth user id by email (service_role / SECURITY DEFINER only).
-- supabase-js admin has no getUserByEmail; listUsers also omits GoTrue's filter.
CREATE OR REPLACE FUNCTION pam_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION pam_auth_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_auth_user_id_by_email(text) TO service_role;

CREATE OR REPLACE FUNCTION update_project_with_environments(
  p_project_id UUID,
  p_updates JSONB,
  p_environments JSONB DEFAULT NULL,
  p_remove_missing BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner_id UUID;
  v_env_record RECORD;
  v_result JSONB;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM pam_projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project % not found', p_project_id;
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: not the owner';
  END IF;

  IF p_updates IS NOT NULL AND jsonb_typeof(p_updates) = 'object' AND p_updates <> '{}'::jsonb THEN
    IF p_updates ? 'owner_id' OR p_updates ? 'id' THEN
      RAISE EXCEPTION 'Cannot update id or owner_id';
    END IF;

    UPDATE pam_projects
    SET
      name = COALESCE((p_updates->>'name')::text, name),
      description = COALESCE((p_updates->>'description')::text, description),
      stack = COALESCE((p_updates->>'stack')::text, stack),
      repo_url = COALESCE((p_updates->>'repo_url')::text, repo_url),
      preview_image_url = COALESCE((p_updates->>'preview_image_url')::text, preview_image_url),
      category = COALESCE((p_updates->>'category')::text, category),
      is_public = COALESCE((p_updates->>'is_public')::int, is_public),
      updated_at = now()
    WHERE id = p_project_id;
  END IF;

  IF p_environments IS NOT NULL AND jsonb_typeof(p_environments) = 'array' THEN
    FOR v_env_record IN
      SELECT id, name, url, variables
      FROM jsonb_to_recordset(p_environments) AS x(id UUID, name TEXT, url TEXT, variables JSONB)
    LOOP
      INSERT INTO pam_environments (id, project_id, name, url, variables)
      VALUES (
        COALESCE(v_env_record.id, gen_random_uuid()),
        p_project_id,
        v_env_record.name,
        v_env_record.url,
        COALESCE(v_env_record.variables, '{}'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        variables = EXCLUDED.variables,
        updated_at = now();
    END LOOP;
  END IF;

  IF p_remove_missing AND p_environments IS NOT NULL THEN
    DELETE FROM pam_environments
    WHERE project_id = p_project_id
    AND id NOT IN (
      SELECT id FROM jsonb_to_recordset(p_environments) AS x(id UUID) WHERE id IS NOT NULL
    );
  END IF;

  SELECT jsonb_build_object(
    'project', row_to_json(p),
    'environments', COALESCE(
      (SELECT jsonb_agg(row_to_json(e)) FROM pam_environments e WHERE e.project_id = p_project_id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM pam_projects p
  WHERE p.id = p_project_id;

  RETURN v_result;
END;
$$;


-- #############################################################################
-- SOURCE: 009-pam-users-search-and-storage.sql
-- #############################################################################

-- User search for project transfer picker (service_role / SECURITY DEFINER).
CREATE OR REPLACE FUNCTION pam_auth_users_search(
  p_query text DEFAULT '',
  p_exclude_id uuid DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
  SELECT u.id, coalesce(u.email, '')::text AS email
  FROM auth.users u
  WHERE (p_exclude_id IS NULL OR u.id <> p_exclude_id)
    AND (
      nullif(trim(coalesce(p_query, '')), '') IS NULL
      OR u.email ILIKE
        '%' || replace(replace(trim(p_query), '\', '\\'), '%', '\%') || '%'
    )
  ORDER BY u.email ASC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(p_limit, 20), 1), 50)
  OFFSET GREATEST(coalesce(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION pam_auth_users_search(text, uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_auth_users_search(text, uuid, int, int) TO service_role;

-- Public cover images for PAM projects (capture once, refresh on demand).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pam-previews',
  'pam-previews',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read pam-previews" ON storage.objects;
CREATE POLICY "Public read pam-previews"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pam-previews');


-- #############################################################################
-- SOURCE: 010-pam-auth-users-search-index.sql
-- #############################################################################

-- Faster transfer-picker search query plan (function only).
-- Do NOT create indexes on auth.users here — that requires table ownership
-- (ERROR 42501: must be owner of table users). Safe to re-run.

-- Prefer prefix match then fall back to contains (same GRANT as 009).
CREATE OR REPLACE FUNCTION pam_auth_users_search(
  p_query text DEFAULT '',
  p_exclude_id uuid DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
  WITH q AS (
    SELECT nullif(trim(coalesce(p_query, '')), '') AS raw,
           lower(nullif(trim(coalesce(p_query, '')), '')) AS raw_lower
  )
  SELECT u.id, coalesce(u.email, '')::text AS email
  FROM auth.users u
  CROSS JOIN q
  WHERE (p_exclude_id IS NULL OR u.id <> p_exclude_id)
    AND (
      q.raw IS NULL
      OR lower(u.email) LIKE q.raw_lower || '%'
      OR u.email ILIKE
        '%' || replace(replace(q.raw, '\', '\\'), '%', '\%') || '%'
    )
  ORDER BY
    CASE
      WHEN q.raw IS NULL THEN 0
      WHEN lower(u.email) LIKE q.raw_lower || '%' THEN 0
      ELSE 1
    END,
    u.email ASC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(p_limit, 20), 1), 50)
  OFFSET GREATEST(coalesce(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION pam_auth_users_search(text, uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_auth_users_search(text, uuid, int, int) TO service_role;


-- #############################################################################
-- SOURCE: 011-pam-projects-list-index.sql
-- #############################################################################

-- List/search indexes for pam_projects (public / private filters + sort).
-- Safe to re-run: IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_pam_projects_list_public_active
  ON pam_projects (created_at DESC, id DESC)
  WHERE is_deleted = 0 AND is_public = 1;

CREATE INDEX IF NOT EXISTS idx_pam_projects_list_private_active
  ON pam_projects (owner_id, created_at DESC, id DESC)
  WHERE is_deleted = 0 AND is_public = 0;

CREATE INDEX IF NOT EXISTS idx_pam_projects_list_active_created
  ON pam_projects (is_public DESC, created_at DESC, id DESC)
  WHERE is_deleted = 0;


-- #############################################################################
-- SOURCE: 014-pam-site-settings.sql
-- #############################################################################

-- Site-wide runtime settings (feature flags, integrations, etc.)
-- Sensitive values are encrypted at the application layer (enc:v1: prefix).
-- Runtime reads this table only; change values in Admin /admin/settings (not .env).

create table if not exists public.pam_site_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  is_sensitive boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.pam_site_settings is
  'PAM runtime site settings. Seeded on migration; edit via Admin console.';

comment on column public.pam_site_settings.key is
  'Dotted setting key, e.g. auth.phone_login_enabled, brain_oauth.site_url.';

comment on column public.pam_site_settings.value is
  'JSON value (string, boolean, string[], etc.). Sensitive values are stored encrypted.';

comment on column public.pam_site_settings.description is
  'Human-readable description of what this setting does (for operators / Admin UI).';

comment on column public.pam_site_settings.is_sensitive is
  'True when value is sensitive (encrypted at rest); never exposed via public API.';

comment on column public.pam_site_settings.updated_at is
  'Last update time.';

create index if not exists idx_pam_site_settings_updated_at
  on public.pam_site_settings (updated_at desc);

alter table public.pam_site_settings enable row level security;

-- No RLS policies: only service_role (admin client) reads/writes from server.

-- Default rows (idempotent). Re-run safe: ON CONFLICT DO NOTHING.
insert into public.pam_site_settings (key, value, description, is_sensitive) values
  (
    'auth.phone_login_enabled',
    'true'::jsonb,
    '是否在登录页展示「手机号」Tab。开发/内测可用 Supabase Test phone + 固定 OTP（Authentication → Phone → Test phone numbers），无需真实短信；正式环境再接 SMS Provider。',
    false
  ),
  (
    'auth.google_oauth_enabled',
    'false'::jsonb,
    '是否在登录页展示 Google OAuth 按钮。需在 Supabase Auth 中启用 Google 提供商。',
    false
  ),
  (
    'auth.brain_pkce_enabled',
    'false'::jsonb,
    '是否启用 Brain OAuth 授权码 + PKCE 流程（PAM 直连 brain-oauth）。适合本地或已配置 CORS 的跨域场景。',
    false
  ),
  (
    'auth.brain_supabase_enabled',
    'false'::jsonb,
    '是否启用 Supabase custom:brain 联合登录。Brain AS 须能被 Supabase 公网访问，本地 localhost 通常不可用。',
    false
  ),
  (
    'auth.cli_token_expires_in',
    '"30d"'::jsonb,
    'pamenv CLI Bearer JWT 的有效期（ms 格式，如 30d、7d）。到期或 pam logout 后需重新登录。',
    false
  ),
  (
    'brain_oauth.site_url',
    '""'::jsonb,
    'brain-oauth 服务根 URL，不含末尾斜杠。示例：http://localhost:3122',
    false
  ),
  (
    'brain_oauth.client_id',
    '""'::jsonb,
    '在 Brain OAuth 开发者控制台注册的 client_id。',
    false
  ),
  (
    'brain_oauth.client_secret',
    '""'::jsonb,
    '机密客户端密钥；纯 PKCE 公共客户端可留空。保存后加密存储，界面不回显明文。',
    true
  ),
  (
    'brain_oauth.redirect_uri',
    '""'::jsonb,
    '须与 Brain OAuth 控制台 redirect_uri 完全一致。留空时默认 {SITE_URL}/api/callback/brain-oauth。',
    false
  ),
  (
    'brain_oauth.scopes',
    '"openid profile email"'::jsonb,
    '授权 scope，空格分隔。默认 openid profile email。',
    false
  ),
  (
    'brain_oauth.locale',
    '""'::jsonb,
    '固定授权页 locale（en | zh）。留空则使用用户当前 UI 语言。',
    false
  ),
  (
    'openai.api_key',
    '""'::jsonb,
    'OpenAI 或兼容网关（Cerebras、自建代理等）的 API 密钥。加密存储，界面不回显明文。',
    true
  ),
  (
    'openai.base_url',
    '""'::jsonb,
    'Chat Completions 兼容接口根地址。示例：https://api.openai.com/v1',
    false
  ),
  (
    'api.cors_origins',
    '[]'::jsonb,
    '逗号分隔的跨域白名单 Origin。用于 /oauth/token 等机器端点。留空表示不启用 CORS。',
    false
  ),
  (
    'api.cors_methods',
    '["GET","POST","OPTIONS"]'::jsonb,
    '逗号分隔的 HTTP 方法列表。默认 GET,POST,OPTIONS。',
    false
  ),
  (
    'storage.preview_bucket',
    '"pam-previews"'::jsonb,
    '项目封面/预览图上传的 Supabase Storage bucket 名称。默认 pam-previews。',
    false
  ),
  (
    'storage.screenshot_url_template',
    '""'::jsonb,
    '生成项目预览图时使用的截图服务地址，{url} 为占位符。留空则使用 Microlink 默认。',
    false
  )
on conflict (key) do nothing;

-- Bootstrap-only: LOG_LEVEL / NEXT_PUBLIC_LOG_LEVEL in .env (not site settings).
delete from public.pam_site_settings where key = 'system.log_level';

alter table public.pam_site_settings drop column if exists updated_by;


-- #############################################################################
-- SOURCE: 015-pam-users.sql
-- #############################################################################

-- PAM application user profiles (1:1 with auth.users).
-- Platform admin and future team membership metadata live here; auth.users stays identity-only.

CREATE TABLE IF NOT EXISTS public.pam_users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_users IS 'PAM user profile and platform-level roles; FK to auth.users.';
COMMENT ON COLUMN public.pam_users.is_platform_admin IS 'Platform admin: /admin UI and /api/admin/* access.';
COMMENT ON COLUMN public.pam_users.status IS 'Application account status (not Supabase auth ban).';

CREATE INDEX IF NOT EXISTS idx_pam_users_email ON public.pam_users (email);
CREATE INDEX IF NOT EXISTS idx_pam_users_platform_admin ON public.pam_users (is_platform_admin)
  WHERE is_platform_admin = TRUE;

ALTER TABLE public.pam_users ENABLE ROW LEVEL SECURITY;

-- No policies: service_role only (same pattern as pam_site_settings).

CREATE OR REPLACE FUNCTION public.pam_users_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pam_users_updated_at ON public.pam_users;
CREATE TRIGGER trigger_pam_users_updated_at
BEFORE UPDATE ON public.pam_users
FOR EACH ROW EXECUTE FUNCTION public.pam_users_set_updated_at();

-- Bootstrap first platform admin (edit email before running in production):
-- INSERT INTO public.pam_users (id, email, is_platform_admin)
-- SELECT id, coalesce(email, ''), TRUE FROM auth.users WHERE email = 'you@example.com'
-- ON CONFLICT (id) DO UPDATE SET is_platform_admin = TRUE, email = EXCLUDED.email;


-- #############################################################################
-- SOURCE: 017-pam-phone-otps.sql
-- #############################################################################

-- Phone OTP send/verify records for PAM (memory | aliyun DysmsAPI).
-- Admin monitors phone + code for memory; aliyun leaves code_plain null.

CREATE TABLE IF NOT EXISTS public.pam_phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  code_plain TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('memory', 'aliyun')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'expired', 'revoked')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_phone_otps IS
  'Phone OTP send/verify audit. memory stores code_plain for Admin; aliyun may omit plaintext.';
COMMENT ON COLUMN public.pam_phone_otps.code_plain IS
  'Plain OTP for Admin monitoring (memory/test). Null in production SMS providers.';
COMMENT ON COLUMN public.pam_phone_otps.provider IS
  'Sending channel: memory (no SMS) | aliyun (DysmsAPI).';

CREATE INDEX IF NOT EXISTS idx_pam_phone_otps_phone_created
  ON public.pam_phone_otps (phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pam_phone_otps_status_created
  ON public.pam_phone_otps (status, created_at DESC);

ALTER TABLE public.pam_phone_otps ENABLE ROW LEVEL SECURITY;

-- Link phone identity on pam_users for find-or-create after OTP verify.
ALTER TABLE public.pam_users
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.pam_users.phone IS
  'E.164 phone for phone-OTP users; unique when present.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_pam_users_phone_unique
  ON public.pam_users (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- Provider switch (memory | aliyun). Default memory for test flow without Twilio.
INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES (
  'auth.phone_otp_provider',
  '"memory"'::jsonb,
  '手机验证码发送通道：memory=不发短信（码进 Admin 监控页）；aliyun=阿里云短信（Admin「阿里云短信」配置）。',
  false
)
ON CONFLICT (key) DO UPDATE
SET description = EXCLUDED.description;

-- Aliyun DysmsAPI settings (edit in Admin; secret encrypted at app layer).
INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES
  (
    'aliyun_sms.access_key_id',
    '""'::jsonb,
    '短信服务 AccessKey ID。建议使用仅短信权限的 RAM 子账号。',
    false
  ),
  (
    'aliyun_sms.access_key_secret',
    '""'::jsonb,
    '短信服务 AccessKey Secret。加密存储，界面不回显明文。',
    true
  ),
  (
    'aliyun_sms.sign_name',
    '""'::jsonb,
    '控制台已审核通过的签名名称（不是签名 ID）。',
    false
  ),
  (
    'aliyun_sms.template_code',
    '""'::jsonb,
    '控制台已审核通过的模板 CODE，须含验证码变量。示例：SMS_123456789',
    false
  ),
  (
    'aliyun_sms.template_param_key',
    '"code"'::jsonb,
    '模板 JSON 中验证码字段名。默认 code → TemplateParam={"code":"123456"}。',
    false
  ),
  (
    'aliyun_sms.region_id',
    '"cn-hangzhou"'::jsonb,
    'DysmsAPI RegionId。默认 cn-hangzhou。',
    false
  ),
  (
    'aliyun_sms.endpoint',
    '"https://dysmsapi.aliyuncs.com"'::jsonb,
    'DysmsAPI 地址。默认 https://dysmsapi.aliyuncs.com。一般无需修改。',
    false
  )
ON CONFLICT (key) DO NOTHING;

-- Keep phone login tab enabled when using PAM memory OTP.
INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES (
  'auth.phone_login_enabled',
  'true'::jsonb,
  '是否在登录页展示「手机号」Tab。memory 模式下码在 Admin「验证码监控」查看；aliyun 模式走真实短信。',
  false
)
ON CONFLICT (key) DO UPDATE
SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;


-- #############################################################################
-- SOURCE: 018-pam-project-collaborators.sql
-- #############################################################################

-- Project collaborators (per-project admin/member). Safe to re-run.
-- Access is enforced in PAMService; this table is service_role only (RLS on, no policies).

CREATE TABLE IF NOT EXISTS public.pam_project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.pam_projects (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active')),
  invited_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pam_project_collaborators_project_user_unique UNIQUE (project_id, user_id)
);

COMMENT ON TABLE public.pam_project_collaborators IS
  'Per-project collaborators; owner stays on pam_projects.owner_id.';
COMMENT ON COLUMN public.pam_project_collaborators.role IS
  'admin: manage collaborators + RW; member: RW / CLI only.';

CREATE INDEX IF NOT EXISTS idx_pam_project_collaborators_user
  ON public.pam_project_collaborators (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pam_project_collaborators_project
  ON public.pam_project_collaborators (project_id)
  WHERE status = 'active';

ALTER TABLE public.pam_project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.pam_project_collaborators_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pam_project_collaborators_updated_at
  ON public.pam_project_collaborators;
CREATE TRIGGER trigger_pam_project_collaborators_updated_at
BEFORE UPDATE ON public.pam_project_collaborators
FOR EACH ROW EXECUTE FUNCTION public.pam_project_collaborators_set_updated_at();

-- Visibility: public OR owner OR active collaborator
CREATE OR REPLACE FUNCTION pam_search_projects(
  p_user_id uuid DEFAULT NULL,
  p_visibility text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10,
  p_include_count boolean DEFAULT TRUE,
  p_include_owner_id boolean DEFAULT TRUE,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page int := GREATEST(coalesce(p_page, 1), 1);
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 10), 1), 100);
  v_offset int;
  v_keyword text;
  v_keyword_escaped text;
  v_total int := 0;
  v_loaded int := 0;
  v_has_more boolean := false;
  v_items jsonb := '[]'::jsonb;
  v_sort_by text := coalesce(nullif(trim(coalesce(p_sort_by, '')), ''), 'created_at');
  v_sort_order text := lower(coalesce(nullif(trim(coalesce(p_sort_order, '')), ''), 'desc'));
BEGIN
  IF v_sort_by NOT IN ('created_at', 'updated_at') THEN
    v_sort_by := 'created_at';
  END IF;
  IF v_sort_order NOT IN ('asc', 'desc') THEN
    v_sort_order := 'desc';
  END IF;

  v_offset := (v_page - 1) * v_page_size;
  v_keyword := nullif(trim(coalesce(p_keyword, '')), '');

  IF p_visibility = 'private' AND p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'page', v_page,
      'pageSize', v_page_size,
      'total', 0,
      'hasMore', false,
      'items', '[]'::jsonb
    );
  END IF;

  IF v_keyword IS NOT NULL THEN
    v_keyword_escaped := replace(replace(replace(v_keyword, '\', '\\'), '%', '\%'), '_', '\_');
  END IF;

  IF p_include_count THEN
    SELECT count(*)::int INTO v_total
    FROM pam_projects p
    WHERE p.is_deleted = 0
      AND (p_category IS NULL OR btrim(p_category) = '' OR p.category = p_category)
      AND (
        (p_visibility IS NULL AND (
          p.is_public = 1
          OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)
          OR (
            p_user_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_project_collaborators c
              WHERE c.project_id = p.id
                AND c.user_id = p_user_id
                AND c.status = 'active'
            )
          )
        ))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND (
          p.owner_id = p_user_id
          OR EXISTS (
            SELECT 1
            FROM pam_project_collaborators c
            WHERE c.project_id = p.id
              AND c.user_id = p_user_id
              AND c.status = 'active'
          )
        ))
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
      );
  END IF;

  WITH paged AS (
    SELECT p.*
    FROM pam_projects p
    WHERE p.is_deleted = 0
      AND (p_category IS NULL OR btrim(p_category) = '' OR p.category = p_category)
      AND (
        (p_visibility IS NULL AND (
          p.is_public = 1
          OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)
          OR (
            p_user_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_project_collaborators c
              WHERE c.project_id = p.id
                AND c.user_id = p_user_id
                AND c.status = 'active'
            )
          )
        ))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND (
          p.owner_id = p_user_id
          OR EXISTS (
            SELECT 1
            FROM pam_project_collaborators c
            WHERE c.project_id = p.id
              AND c.user_id = p_user_id
              AND c.status = 'active'
          )
        ))
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
      )
    ORDER BY
      p.is_public DESC,
      CASE
        WHEN v_sort_order = 'asc' THEN
          CASE WHEN v_sort_by = 'updated_at' THEN p.updated_at ELSE p.created_at END
      END ASC NULLS LAST,
      CASE
        WHEN v_sort_order = 'desc' THEN
          CASE WHEN v_sort_by = 'updated_at' THEN p.updated_at ELSE p.created_at END
      END DESC NULLS LAST,
      CASE WHEN v_sort_order = 'asc' THEN p.id END ASC,
      CASE WHEN v_sort_order = 'desc' THEN p.id END DESC
    LIMIT v_page_size
    OFFSET v_offset
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', row.id,
        'slug', row.slug,
        'name', row.name,
        'category', row.category,
        'description', row.description,
        'stack', row.stack,
        'repo_url', row.repo_url,
        'preview_image_url', row.preview_image_url,
        'is_public', row.is_public,
        'create_source', row.create_source,
        'created_at', row.created_at,
        'updated_at', row.updated_at
      )
      || CASE
        WHEN p_include_owner_id THEN jsonb_build_object('owner_id', row.owner_id)
        ELSE '{}'::jsonb
      END
      || jsonb_build_object(
        'environments', coalesce(row.envs, '[]'::jsonb)
      )
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM (
    SELECT
      p.*,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'url', e.url
          )
          ORDER BY e.name
        )
        FROM pam_environments e
        WHERE e.project_id = p.id
      ) AS envs
    FROM paged p
  ) AS row;

  v_loaded := coalesce(jsonb_array_length(v_items), 0);

  IF v_loaded < v_page_size THEN
    v_has_more := false;
  ELSIF p_include_count AND v_total > 0 THEN
    v_has_more := (v_offset + v_loaded) < v_total;
  ELSE
    v_has_more := v_loaded >= v_page_size;
  END IF;

  IF NOT p_include_count AND v_total = 0 AND v_loaded > 0 THEN
    v_total := v_offset + v_loaded;
  END IF;

  RETURN jsonb_build_object(
    'page', v_page,
    'pageSize', v_page_size,
    'total', v_total,
    'hasMore', v_has_more,
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) TO service_role;


-- #############################################################################
-- SOURCE: 019-pam-users-email-nullable.sql
-- #############################################################################

-- Allow pam_users.email to be null for phone-only accounts.
-- Real emails remain unique; placeholder *@phone.pam.local is not treated as business email.

ALTER TABLE public.pam_users
  ALTER COLUMN email DROP NOT NULL;

COMMENT ON COLUMN public.pam_users.email IS
  'Verified business email when present. Null for phone-only profiles. Do not store @phone.pam.local here.';

-- Unique among real emails (exclude null/empty/placeholder).
DROP INDEX IF EXISTS public.idx_pam_users_email_unique_real;
CREATE UNIQUE INDEX idx_pam_users_email_unique_real
  ON public.pam_users (lower(email))
  WHERE email IS NOT NULL
    AND btrim(email) <> ''
    AND lower(email) NOT LIKE '%@phone.pam.local';


-- #############################################################################
-- SOURCE: 020-pam-roles.sql
-- #############################################################################

-- PAM roles / permissions / teams (single rewrite script).
-- Safe to re-run on feat branch. Resolves role_id by pam_roles.key (no hardcoded UUIDs).
-- Keep in sync with apps/pam/shared/auth/permissionKeys.ts
-- Permission identity: permission_key only (no uid/slug).

-- ---------------------------------------------------------------------------
-- 0) Tear down dependents
-- ---------------------------------------------------------------------------

ALTER TABLE public.pam_users
  DROP CONSTRAINT IF EXISTS pam_users_role_id_fkey;

ALTER TABLE public.pam_projects
  DROP CONSTRAINT IF EXISTS pam_projects_team_id_fkey;

DROP TABLE IF EXISTS public.pam_role_team_members;
DROP TABLE IF EXISTS public.pam_team_members;
DROP TABLE IF EXISTS public.pam_role_teams;
DROP TABLE IF EXISTS public.pam_teams;

DROP TABLE IF EXISTS public.pam_role_assignments;
DROP TABLE IF EXISTS public.pam_roles;
DROP TABLE IF EXISTS public.pam_role_permissions;
DROP TABLE IF EXISTS public.pam_permissions;

-- ---------------------------------------------------------------------------
-- 1) Roles
-- ---------------------------------------------------------------------------

CREATE TABLE public.pam_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('platform', 'team')),
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pam_roles_key_unique UNIQUE (key)
);

COMMENT ON TABLE public.pam_roles IS
  'Flat role templates. kind=platform|team. Bound via role_id only.';

INSERT INTO public.pam_roles (key, name, kind, description, is_system) VALUES
  ('user', '普通用户', 'platform', 'Default registered user', TRUE),
  ('operator', '运营', 'platform', 'Admin console read', TRUE),
  ('admin', '系统管理员', 'platform', 'Admin console write', TRUE),
  ('team_owner', '团队所有者', 'team', 'Team creator / owner', TRUE),
  ('team_admin', '团队管理员', 'team', 'Team admin', TRUE),
  ('team_member', '团队成员', 'team', 'Team member', TRUE);

-- ---------------------------------------------------------------------------
-- 2) Permission catalog (permission_key PK)
-- ---------------------------------------------------------------------------

CREATE TABLE public.pam_role_permissions (
  permission_key TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'api' CHECK (type IN ('api', 'page', 'feature')),
  method TEXT CHECK (method IS NULL OR method IN ('get', 'post', 'patch', 'put', 'delete')),
  path TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pam_role_permissions_key_format CHECK (
    permission_key ~ '^[A-Za-z_][A-Za-z0-9_]*$'
  )
);

COMMENT ON TABLE public.pam_role_permissions IS
  'Permission catalog; permission_key is sole auth/i18n/UI identity (permission:{key}).';

COMMENT ON COLUMN public.pam_role_permissions.permission_key IS
  'Immutable permission id; i18n permission:{permission_key}; UI data-permission.';

COMMENT ON COLUMN public.pam_role_permissions.method IS
  'Optional HTTP method metadata for catalog.';

COMMENT ON COLUMN public.pam_role_permissions.path IS
  'Optional API path template metadata for catalog.';

COMMENT ON COLUMN public.pam_role_permissions.description IS
  'Optional DB note; UI uses permission:{permission_key} translations.';

CREATE TABLE public.pam_role_assignments (
  role_id UUID NOT NULL REFERENCES public.pam_roles (id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.pam_role_permissions (permission_key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

CREATE INDEX idx_pam_role_assignments_role_id
  ON public.pam_role_assignments (role_id);

COMMENT ON TABLE public.pam_role_assignments IS
  'role_id → permission_key (flat).';

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description) VALUES
  ('admin_users_read', 'api', 'get', '/api/admin/users', 'List platform users'),
  ('admin_users_platform_admin', 'api', 'patch', '/api/admin/users/:userId/platform-admin', 'Set platform admin / system role'),
  ('admin_users_system_role', 'api', 'patch', '/api/admin/users/:userId/system-role', 'Set platform role'),
  ('admin_roles_read', 'api', 'get', '/api/admin/roles', 'List roles and assignments'),
  ('admin_roles_write', 'api', 'patch', '/api/admin/roles', 'Replace role permission assignments'),
  ('admin_permissions_read', 'api', 'get', '/api/admin/permissions', 'List permission catalog'),
  ('admin_permissions_write', 'api', 'post', '/api/admin/permissions', 'Create or update permission catalog'),
  ('admin_request_logs_read', 'api', 'get', '/api/admin/request-logs', 'Read request audit logs'),
  ('admin_phone_otps_read', 'api', 'get', '/api/admin/phone-otps', 'List phone OTP records'),
  ('admin_site_settings_read', 'api', 'get', '/api/admin/site-settings', 'Read site settings'),
  ('admin_site_settings_write', 'api', 'patch', '/api/admin/site-settings', 'Update site settings'),
  ('admin_locales_read', 'api', 'get', '/api/admin/locales', 'List locale dictionary rows'),
  ('admin_locales_write', 'api', 'post', '/api/admin/locales', 'Create / update / import locales'),
  ('pam_collaborators_read', 'api', 'get', '/api/pam/:projectId/collaborators', 'List project collaborators'),
  ('pam_collaborators_create', 'api', 'post', '/api/pam/:projectId/collaborators', 'Add project collaborator'),
  ('pam_collaborators_update', 'api', 'patch', '/api/pam/:projectId/collaborators/:userId', 'Update collaborator role'),
  ('pam_collaborators_delete', 'api', 'delete', '/api/pam/:projectId/collaborators/:userId', 'Remove collaborator'),
  ('pam_environments_read', 'api', 'get', '/api/pam/:projectId/environments', 'List project environments'),
  ('pam_environments_create', 'api', 'post', '/api/pam/:projectId/environments', 'Create environment'),
  ('pam_environments_delete', 'api', 'post', '/api/pam/:projectId/environments/:envId/delete', 'Delete environment'),
  ('pam_environments_variables_write', 'api', 'post', '/api/pam/:projectId/environments/:envId/variables', 'Replace environment variables'),
  ('pam_environments_export', 'api', 'get', '/api/pam/:projectId/environments/:envId/export', 'Export environment dotenv'),
  ('pam_project_delete', 'api', 'post', '/api/pam/delete/:id', 'Delete project'),
  ('pam_project_edit', 'api', 'post', '/api/pam/edit/:id', 'Update project'),
  ('pam_project_transfer', 'api', 'post', '/api/pam/transfer/:id', 'Transfer project ownership'),
  ('pam_project_preview_write', 'api', 'post', '/api/pam/preview-image/:id', 'Refresh project preview image'),
  ('pam_project_create', 'api', 'post', '/api/pam/create', 'Create project'),
  ('pam_project_fork', 'api', 'post', '/api/pam/fork/:id', 'Fork project'),
  ('pam_teams_list', 'api', 'get', '/api/pam/teams', 'List my teams'),
  ('pam_teams_create', 'api', 'post', '/api/pam/teams', 'Create team'),
  ('pam_teams_read', 'api', 'get', '/api/pam/teams/:teamId', 'Get team detail'),
  ('pam_teams_members_create', 'api', 'post', '/api/pam/teams/:teamId/members', 'Add team member'),
  ('pam_teams_members_update', 'api', 'patch', '/api/pam/teams/:teamId/members/:userId', 'Update team member role'),
  ('pam_teams_members_delete', 'api', 'delete', '/api/pam/teams/:teamId/members/:userId', 'Remove team member'),
  ('pam_teams_projects_attach', 'api', 'post', '/api/pam/teams/:teamId/projects', 'Attach project to team'),
  ('pam_teams_delete', 'api', 'delete', '/api/pam/teams/:teamId', 'Dissolve team');

-- ---------------------------------------------------------------------------
-- 3) Default assignments (by role key)
-- ---------------------------------------------------------------------------

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_teams_list'),
  ('pam_teams_create'),
  ('pam_project_create'),
  ('pam_project_fork')
) AS v(permission_key) ON TRUE
WHERE r.key = 'user';

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_teams_list'),
  ('pam_teams_create'),
  ('pam_project_create'),
  ('pam_project_fork'),
  ('admin_users_read'),
  ('admin_roles_read'),
  ('admin_request_logs_read'),
  ('admin_phone_otps_read'),
  ('admin_site_settings_read'),
  ('admin_locales_read')
) AS v(permission_key) ON TRUE
WHERE r.key = 'operator';

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_teams_list'),
  ('pam_teams_create'),
  ('pam_project_create'),
  ('pam_project_fork'),
  ('admin_users_read'),
  ('admin_users_platform_admin'),
  ('admin_users_system_role'),
  ('admin_roles_read'),
  ('admin_roles_write'),
  ('admin_permissions_read'),
  ('admin_permissions_write'),
  ('admin_request_logs_read'),
  ('admin_phone_otps_read'),
  ('admin_site_settings_read'),
  ('admin_site_settings_write'),
  ('admin_locales_read'),
  ('admin_locales_write')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin';

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_environments_read'),
  ('pam_environments_create'),
  ('pam_environments_variables_write'),
  ('pam_environments_export'),
  ('pam_project_edit'),
  ('pam_project_preview_write'),
  ('pam_teams_read')
) AS v(permission_key) ON TRUE
WHERE r.key = 'team_member';

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_environments_read'),
  ('pam_environments_create'),
  ('pam_environments_delete'),
  ('pam_environments_variables_write'),
  ('pam_environments_export'),
  ('pam_project_edit'),
  ('pam_project_preview_write'),
  ('pam_teams_read'),
  ('pam_teams_members_create'),
  ('pam_teams_members_update'),
  ('pam_teams_members_delete'),
  ('pam_teams_projects_attach')
) AS v(permission_key) ON TRUE
WHERE r.key = 'team_admin';

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_environments_read'),
  ('pam_environments_create'),
  ('pam_environments_delete'),
  ('pam_environments_variables_write'),
  ('pam_environments_export'),
  ('pam_project_delete'),
  ('pam_project_edit'),
  ('pam_project_transfer'),
  ('pam_project_preview_write'),
  ('pam_teams_read'),
  ('pam_teams_members_create'),
  ('pam_teams_members_update'),
  ('pam_teams_members_delete'),
  ('pam_teams_projects_attach'),
  ('pam_teams_delete')
) AS v(permission_key) ON TRUE
WHERE r.key = 'team_owner';

-- ---------------------------------------------------------------------------
-- 4) pam_users.role_id (drop legacy system_role)
-- ---------------------------------------------------------------------------

ALTER TABLE public.pam_users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE public.pam_users DROP CONSTRAINT IF EXISTS pam_users_system_role_check;
ALTER TABLE public.pam_users DROP CONSTRAINT IF EXISTS pam_users_role_id_fkey;

-- Re-runnable: previous runs may have SET NOT NULL; allow remap after pam_roles recreate.
ALTER TABLE public.pam_users ALTER COLUMN role_id DROP NOT NULL;

-- Stale role_id after DROP/recreate pam_roles must not block remapping.
UPDATE public.pam_users
SET role_id = NULL
WHERE role_id IS NOT NULL
  AND role_id NOT IN (SELECT id FROM public.pam_roles);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pam_users' AND column_name = 'system_role'
  ) THEN
    UPDATE public.pam_users u
    SET role_id = r.id
    FROM public.pam_roles r
    WHERE r.key = CASE
      WHEN u.system_role = 'admin' THEN 'admin'
      WHEN u.system_role = 'operator' THEN 'operator'
      ELSE 'user'
    END;
  END IF;

  -- Legacy flag wins for platform admin (even if system_role was missing).
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pam_users' AND column_name = 'is_platform_admin'
  ) THEN
    UPDATE public.pam_users u
    SET role_id = r.id
    FROM public.pam_roles r
    WHERE r.key = 'admin'
      AND u.is_platform_admin = TRUE;
  END IF;
END $$;

UPDATE public.pam_users u
SET role_id = r.id
FROM public.pam_roles r
WHERE r.key = 'user'
  AND u.role_id IS NULL;

ALTER TABLE public.pam_users ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE public.pam_users
  ADD CONSTRAINT pam_users_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES public.pam_roles (id);
ALTER TABLE public.pam_users DROP COLUMN IF EXISTS system_role;
CREATE INDEX IF NOT EXISTS idx_pam_users_role_id ON public.pam_users (role_id);

-- ---------------------------------------------------------------------------
-- 5) Teams
-- ---------------------------------------------------------------------------

CREATE TABLE public.pam_role_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  is_deleted SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pam_role_teams_slug_nonempty CHECK (length(trim(slug)) > 0)
);

CREATE UNIQUE INDEX idx_pam_role_teams_slug_active
  ON public.pam_role_teams (slug)
  WHERE is_deleted = 0;

CREATE INDEX idx_pam_role_teams_owner_id
  ON public.pam_role_teams (owner_id)
  WHERE is_deleted = 0;

COMMENT ON TABLE public.pam_role_teams IS
  'Team container. Projects attach via pam_projects.team_id.';

CREATE TABLE public.pam_role_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.pam_role_teams (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.pam_roles (id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active')),
  invited_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pam_role_team_members_team_user_unique UNIQUE (team_id, user_id)
);

CREATE INDEX idx_pam_role_team_members_user
  ON public.pam_role_team_members (user_id)
  WHERE status = 'active';

CREATE INDEX idx_pam_role_team_members_team
  ON public.pam_role_team_members (team_id)
  WHERE status = 'active';

CREATE INDEX idx_pam_role_team_members_role_id
  ON public.pam_role_team_members (role_id);

COMMENT ON TABLE public.pam_role_team_members IS
  'Team membership; permissions via role_id → pam_role_assignments.';

ALTER TABLE public.pam_role_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pam_role_team_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.pam_role_teams_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pam_role_teams_updated_at ON public.pam_role_teams;
CREATE TRIGGER trigger_pam_role_teams_updated_at
BEFORE UPDATE ON public.pam_role_teams
FOR EACH ROW EXECUTE FUNCTION public.pam_role_teams_set_updated_at();

CREATE OR REPLACE FUNCTION public.pam_role_team_members_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pam_role_team_members_updated_at
  ON public.pam_role_team_members;
CREATE TRIGGER trigger_pam_role_team_members_updated_at
BEFORE UPDATE ON public.pam_role_team_members
FOR EACH ROW EXECUTE FUNCTION public.pam_role_team_members_set_updated_at();

ALTER TABLE public.pam_projects
  ADD COLUMN IF NOT EXISTS team_id UUID;

UPDATE public.pam_projects SET team_id = NULL WHERE team_id IS NOT NULL;

ALTER TABLE public.pam_projects
  DROP CONSTRAINT IF EXISTS pam_projects_team_id_fkey;

ALTER TABLE public.pam_projects
  ADD CONSTRAINT pam_projects_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.pam_role_teams (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pam_projects_team_id
  ON public.pam_projects (team_id)
  WHERE is_deleted = 0 AND team_id IS NOT NULL;

COMMENT ON COLUMN public.pam_projects.team_id IS
  'Owning pam_role_teams row. Null = legacy/unassigned.';

-- Backfill personal teams + members from project owners / collaborators
DO $$
DECLARE
  r RECORD;
  v_team_id UUID;
  c RECORD;
  v_existing UUID;
  v_rank INT;
  v_new_rank INT;
  v_role_id UUID;
  RID_OWNER UUID;
  RID_ADMIN UUID;
  RID_MEMBER UUID;
BEGIN
  SELECT id INTO RID_OWNER FROM public.pam_roles WHERE key = 'team_owner';
  SELECT id INTO RID_ADMIN FROM public.pam_roles WHERE key = 'team_admin';
  SELECT id INTO RID_MEMBER FROM public.pam_roles WHERE key = 'team_member';

  IF RID_OWNER IS NULL OR RID_ADMIN IS NULL OR RID_MEMBER IS NULL THEN
    RAISE EXCEPTION 'pam_roles team_* keys missing';
  END IF;

  FOR r IN
    SELECT DISTINCT owner_id
    FROM public.pam_projects
    WHERE is_deleted = 0
      AND owner_id IS NOT NULL
  LOOP
    SELECT id INTO v_team_id
    FROM public.pam_role_teams
    WHERE owner_id = r.owner_id
      AND is_deleted = 0
      AND slug = 'personal-' || r.owner_id::text
    LIMIT 1;

    IF v_team_id IS NULL THEN
      INSERT INTO public.pam_role_teams (name, slug, owner_id)
      VALUES (
        'Personal',
        'personal-' || r.owner_id::text,
        r.owner_id
      )
      RETURNING id INTO v_team_id;

      INSERT INTO public.pam_role_team_members (team_id, user_id, role_id, invited_by)
      VALUES (v_team_id, r.owner_id, RID_OWNER, r.owner_id)
      ON CONFLICT (team_id, user_id) DO NOTHING;
    END IF;

    UPDATE public.pam_projects
    SET team_id = v_team_id
    WHERE owner_id = r.owner_id
      AND is_deleted = 0
      AND team_id IS NULL;

    FOR c IN
      SELECT DISTINCT ON (pc.user_id)
        pc.user_id,
        pc.role,
        pc.invited_by
      FROM public.pam_project_collaborators pc
      INNER JOIN public.pam_projects p ON p.id = pc.project_id
      WHERE p.owner_id = r.owner_id
        AND p.is_deleted = 0
        AND pc.status = 'active'
        AND pc.user_id <> r.owner_id
      ORDER BY pc.user_id,
        CASE pc.role WHEN 'admin' THEN 2 WHEN 'member' THEN 1 ELSE 0 END DESC
    LOOP
      SELECT role_id INTO v_existing
      FROM public.pam_role_team_members
      WHERE team_id = v_team_id
        AND user_id = c.user_id
        AND status = 'active';

      v_rank := CASE v_existing
        WHEN RID_OWNER THEN 3
        WHEN RID_ADMIN THEN 2
        WHEN RID_MEMBER THEN 1
        ELSE 0
      END;
      v_new_rank := CASE c.role
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 1
        ELSE 0
      END;
      v_role_id := CASE c.role
        WHEN 'admin' THEN RID_ADMIN
        ELSE RID_MEMBER
      END;

      IF v_existing IS NULL THEN
        INSERT INTO public.pam_role_team_members (team_id, user_id, role_id, invited_by)
        VALUES (v_team_id, c.user_id, v_role_id, c.invited_by)
        ON CONFLICT (team_id, user_id) DO NOTHING;
      ELSIF v_new_rank > v_rank AND v_existing <> RID_OWNER THEN
        UPDATE public.pam_role_team_members
        SET role_id = v_role_id
        WHERE team_id = v_team_id
          AND user_id = c.user_id;
      END IF;
    END LOOP;
  END LOOP;
END $$;


-- #############################################################################
-- SOURCE: 021-pam-projects-backfill-team-id.sql
-- #############################################################################

-- Backfill pam_projects.team_id from existing personal teams (slug personal-{owner_id}).
-- Projects whose owners have no personal team yet are healed lazily by PAMService.computeAccessRole.

UPDATE public.pam_projects AS p
SET team_id = t.id
FROM public.pam_role_teams AS t
WHERE p.team_id IS NULL
  AND p.is_deleted = 0
  AND t.is_deleted = 0
  AND t.slug = 'personal-' || p.owner_id::text;


-- #############################################################################
-- SOURCE: 022-pam-search-projects-team.sql
-- #############################################################################

-- pam_search_projects: private visibility via team membership (not collaborators).
-- Safe to re-run. Replaces visibility predicates that used pam_project_collaborators.

CREATE OR REPLACE FUNCTION pam_search_projects(
  p_user_id uuid DEFAULT NULL,
  p_visibility text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10,
  p_include_count boolean DEFAULT TRUE,
  p_include_owner_id boolean DEFAULT TRUE,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page int := GREATEST(coalesce(p_page, 1), 1);
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 10), 1), 100);
  v_offset int;
  v_keyword text;
  v_keyword_escaped text;
  v_total int := 0;
  v_loaded int := 0;
  v_has_more boolean := false;
  v_items jsonb := '[]'::jsonb;
  v_sort_by text := coalesce(nullif(trim(coalesce(p_sort_by, '')), ''), 'created_at');
  v_sort_order text := lower(coalesce(nullif(trim(coalesce(p_sort_order, '')), ''), 'desc'));
BEGIN
  IF v_sort_by NOT IN ('created_at', 'updated_at') THEN
    v_sort_by := 'created_at';
  END IF;
  IF v_sort_order NOT IN ('asc', 'desc') THEN
    v_sort_order := 'desc';
  END IF;

  v_offset := (v_page - 1) * v_page_size;
  v_keyword := nullif(trim(coalesce(p_keyword, '')), '');

  IF p_visibility = 'private' AND p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'page', v_page,
      'pageSize', v_page_size,
      'total', 0,
      'hasMore', false,
      'items', '[]'::jsonb
    );
  END IF;

  IF v_keyword IS NOT NULL THEN
    v_keyword_escaped := replace(replace(replace(v_keyword, '\', '\\'), '%', '\%'), '_', '\_');
  END IF;

  IF p_include_count THEN
    SELECT count(*)::int INTO v_total
    FROM pam_projects p
    WHERE p.is_deleted = 0
      AND (p_category IS NULL OR btrim(p_category) = '' OR p.category = p_category)
      AND (
        (p_visibility IS NULL AND (
          p.is_public = 1
          OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)
          OR (
            p_user_id IS NOT NULL
            AND p.team_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_role_team_members m
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
            )
          )
        ))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND (
          p.owner_id = p_user_id
          OR (
            p.team_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_role_team_members m
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
            )
          )
        ))
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
      );
  END IF;

  WITH paged AS (
    SELECT p.*
    FROM pam_projects p
    WHERE p.is_deleted = 0
      AND (p_category IS NULL OR btrim(p_category) = '' OR p.category = p_category)
      AND (
        (p_visibility IS NULL AND (
          p.is_public = 1
          OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)
          OR (
            p_user_id IS NOT NULL
            AND p.team_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_role_team_members m
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
            )
          )
        ))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND (
          p.owner_id = p_user_id
          OR (
            p.team_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_role_team_members m
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
            )
          )
        ))
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
      )
    ORDER BY
      p.is_public DESC,
      CASE
        WHEN v_sort_order = 'asc' THEN
          CASE WHEN v_sort_by = 'updated_at' THEN p.updated_at ELSE p.created_at END
      END ASC NULLS LAST,
      CASE
        WHEN v_sort_order = 'desc' THEN
          CASE WHEN v_sort_by = 'updated_at' THEN p.updated_at ELSE p.created_at END
      END DESC NULLS LAST,
      CASE WHEN v_sort_order = 'asc' THEN p.id END ASC,
      CASE WHEN v_sort_order = 'desc' THEN p.id END DESC
    LIMIT v_page_size
    OFFSET v_offset
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', row.id,
        'slug', row.slug,
        'name', row.name,
        'category', row.category,
        'description', row.description,
        'stack', row.stack,
        'repo_url', row.repo_url,
        'preview_image_url', row.preview_image_url,
        'is_public', row.is_public,
        'create_source', row.create_source,
        'created_at', row.created_at,
        'updated_at', row.updated_at,
        'team_id', row.team_id
      )
      || CASE
        WHEN p_include_owner_id THEN jsonb_build_object('owner_id', row.owner_id)
        ELSE '{}'::jsonb
      END
      || jsonb_build_object(
        'environments', coalesce(row.envs, '[]'::jsonb)
      )
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM (
    SELECT
      p.*,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'url', e.url
          )
          ORDER BY e.name
        )
        FROM pam_environments e
        WHERE e.project_id = p.id
      ) AS envs
    FROM paged p
  ) AS row;

  v_loaded := coalesce(jsonb_array_length(v_items), 0);

  IF v_loaded < v_page_size THEN
    v_has_more := false;
  ELSIF p_include_count AND v_total > 0 THEN
    v_has_more := (v_offset + v_loaded) < v_total;
  ELSE
    v_has_more := v_loaded >= v_page_size;
  END IF;

  IF NOT p_include_count AND v_total = 0 AND v_loaded > 0 THEN
    v_total := v_offset + v_loaded;
  END IF;

  RETURN jsonb_build_object(
    'page', v_page,
    'pageSize', v_page_size,
    'total', v_total,
    'hasMore', v_has_more,
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) TO service_role;


-- #############################################################################
-- SOURCE: 023-pam-locales.sql
-- #############################################################################

-- PAM locales CMS: pam_locales table + admin_locales_* permissions.
-- Incremental: safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- Keep permission_key in sync with apps/pam/shared/auth/permissionKeys.ts

-- ---------------------------------------------------------------------------
-- 1) Locale dictionary table (aligned with @qlover/next-kit localesSchema)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pam_locales (
  id BIGSERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  en TEXT NOT NULL DEFAULT '',
  zh TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  namespace TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pam_locales_value_unique UNIQUE (value)
);

COMMENT ON TABLE public.pam_locales IS
  'Runtime i18n dictionary rows. Edited via Admin /admin/locales when useApiLocales=true.';

COMMENT ON COLUMN public.pam_locales.value IS
  'i18n key (namespace:key), unique.';

COMMENT ON COLUMN public.pam_locales.en IS
  'English translation.';

COMMENT ON COLUMN public.pam_locales.zh IS
  'Chinese translation.';

COMMENT ON COLUMN public.pam_locales.description IS
  'Optional note; often seeded from fallback locale text.';

COMMENT ON COLUMN public.pam_locales.namespace IS
  'Namespace prefix derived from value (e.g. common, api, admin_settings).';

CREATE INDEX IF NOT EXISTS idx_pam_locales_namespace
  ON public.pam_locales (namespace);

CREATE INDEX IF NOT EXISTS idx_pam_locales_updated_at
  ON public.pam_locales (updated_at DESC);

ALTER TABLE public.pam_locales ENABLE ROW LEVEL SECURITY;

-- No RLS policies: only service_role (admin client) reads/writes from server.

-- ---------------------------------------------------------------------------
-- 2) Permission catalog + role assignments
-- ---------------------------------------------------------------------------

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description)
VALUES
  ('admin_locales_read', 'api', 'get', '/api/admin/locales', 'List locale dictionary rows'),
  ('admin_locales_write', 'api', 'post', '/api/admin/locales', 'Create / update / import locales')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_locales_read')
) AS v(permission_key) ON TRUE
WHERE r.key = 'operator'
ON CONFLICT (role_id, permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_locales_read'),
  ('admin_locales_write')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin'
ON CONFLICT (role_id, permission_key) DO NOTHING;

