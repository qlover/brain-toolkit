-- =============================================================================
-- PAM full schema (single script, safe to re-run in DEV)
-- FRESH INSTALLS ONLY: drops and recreates tables. Existing DB 閳?001-pam-upgrade.sql
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

-- Next OAuth Wrapper middleware schema (full recreate 閳?safe to re-run in dev)
-- Drops existing pam_oauth_* (and legacy n_oauth_wrapper__*) then creates fresh objects.
-- OAuth tables below optionally enable RLS (see end of file). Without RLS, server can use SUPABASE_ANON_KEY; with RLS and no anon policies, use service role or add policies.

-- ---------------------------------------------------------------------------
-- Drop (children first, then clients; includes legacy unprefixed table names)
-- ---------------------------------------------------------------------------

drop table if exists public.pam_oauth_authorization_codes cascade;
drop table if exists public.pam_oauth_refresh_tokens cascade;
drop table if exists public.pam_oauth_user_credentials cascade;
drop table if exists public.pam_oauth_consent_grants cascade;
drop table if exists public.pam_oauth_clients cascade;
-- Legacy names (pre pam_oauth_* rename)
drop table if exists public.n_oauth_wrapper__authorization_codes cascade;
drop table if exists public.n_oauth_wrapper__refresh_tokens cascade;
drop table if exists public.n_oauth_wrapper__user_credentials cascade;
drop table if exists public.n_oauth_wrapper__clients cascade;

-- ---------------------------------------------------------------------------
-- pam_oauth_clients 閳?registered third-party OAuth 2.0 applications
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
-- pam_oauth_authorization_codes 閳?one-time authorization codes (5 min TTL)
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
-- pam_oauth_refresh_tokens 閳?middleware refresh_token 閳?client/user mapping
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
-- pam_oauth_user_credentials 閳?long-lived upstream provider tokens per user_id
-- ---------------------------------------------------------------------------

create table public.pam_oauth_user_credentials (
  user_id text primary key,
  provider_refresh_token text,
  provider_session_token text,
  updated_at timestamptz not null default now()
);

comment on column public.pam_oauth_user_credentials.provider_refresh_token is 'Encrypted upstream provider refresh_token for long-lived user credentials.';

alter table public.pam_oauth_user_credentials enable row level security;

-- ---------------------------------------------------------------------------
-- pam_oauth_consent_grants 閳?remembered "trust this app" per user + client + device
-- ---------------------------------------------------------------------------

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


-- #############################################################################
-- SOURCE: 003-pam-base.sql
-- #############################################################################

-- ============================================================
-- 1. 閸掔娀娅庨弮褑銆冮敍鍫ｇ殤閹卞函绱掗敍?-- ============================================================
DROP TABLE IF EXISTS pam_env_variables CASCADE;
DROP TABLE IF EXISTS pam_environments CASCADE;
DROP TABLE IF EXISTS pam_projects CASCADE;

-- ============================================================
-- 2. 閸掓稑缂撴い鍦窗鐞?-- ============================================================
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
-- 3. 閸掓稑缂撻悳顖氼暔鐞?-- ============================================================
CREATE TABLE pam_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pam_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT,
    -- Legacy JSONB; source of truth is pam_env_variables (kept for rollback).
    variables JSONB DEFAULT '[]'::jsonb,
    is_protected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

COMMENT ON COLUMN pam_environments.is_protected IS
  'Protected env: resolve (pamenv run) also requires pam_environments_export.';

COMMENT ON COLUMN pam_environments.variables IS
  'Legacy JSONB blob. Prefer pam_env_variables.';

CREATE TABLE pam_env_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment_id UUID NOT NULL REFERENCES pam_environments(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    comments JSONB,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (environment_id, key)
);

COMMENT ON TABLE pam_env_variables IS
  'Per-key environment variables (replaces pam_environments.variables JSONB as source of truth).';

-- ============================================================
-- 4. 缁便垹绱?-- ============================================================
CREATE INDEX idx_pam_projects_owner_id ON pam_projects(owner_id);
CREATE INDEX idx_pam_projects_visibility ON pam_projects(is_public);
CREATE INDEX idx_pam_projects_category ON pam_projects(category);
CREATE INDEX idx_pam_projects_slug ON pam_projects(slug);
-- Active projects only: soft-deleted rows release the slug for reuse.
CREATE UNIQUE INDEX idx_pam_projects_slug_active
  ON pam_projects (slug)
  WHERE is_deleted = 0;
CREATE INDEX idx_pam_environments_project_id ON pam_environments(project_id);
CREATE INDEX idx_pam_env_variables_environment_id ON pam_env_variables(environment_id);

-- ============================================================
-- 5. 閼奉亜濮╅弴瀛樻煀閺冨爼妫块幋鍐插毐閺?-- ============================================================
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

CREATE TRIGGER trigger_pam_env_variables_updated_at
BEFORE UPDATE ON pam_env_variables
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 閸氼垳鏁?RLS
-- ============================================================
ALTER TABLE pam_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pam_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pam_env_variables ENABLE ROW LEVEL SECURITY;

-- 娑撹桨绨″ù瀣槸閺傞€涚┒閿涘苯鍘涢崚娑樼紦鐎硅姤婢楅惃?RLS閿涘牆褰查崥搴ｇ敾鐠嬪啯鏆ｉ敍?CREATE POLICY "Select pam_projects" ON pam_projects
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

-- 閻滎垰顣ㄧ粵鏍殣
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

CREATE POLICY "Select pam_env_variables" ON pam_env_variables
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM pam_environments e
        JOIN pam_projects p ON p.id = e.project_id
        WHERE e.id = pam_env_variables.environment_id
          AND (p.is_public = 1 OR p.owner_id = auth.uid())
    )
);

CREATE POLICY "Insert pam_env_variables" ON pam_env_variables
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM pam_environments e
        JOIN pam_projects p ON p.id = e.project_id
        WHERE e.id = pam_env_variables.environment_id
          AND p.owner_id = auth.uid()
    )
);

CREATE POLICY "Update pam_env_variables" ON pam_env_variables
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM pam_environments e
        JOIN pam_projects p ON p.id = e.project_id
        WHERE e.id = pam_env_variables.environment_id
          AND p.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM pam_environments e
        JOIN pam_projects p ON p.id = e.project_id
        WHERE e.id = pam_env_variables.environment_id
          AND p.owner_id = auth.uid()
    )
);

CREATE POLICY "Delete pam_env_variables" ON pam_env_variables
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM pam_environments e
        JOIN pam_projects p ON p.id = e.project_id
        WHERE e.id = pam_env_variables.environment_id
          AND p.owner_id = auth.uid()
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
  v_env_id UUID;
  v_var RECORD;
  v_ord INT;
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
      v_env_id := COALESCE(v_env_record.id, gen_random_uuid());

      -- Legacy pam_environments.variables is unused; only name/url are updated here.
      INSERT INTO pam_environments (id, project_id, name, url)
      VALUES (
        v_env_id,
        p_project_id,
        v_env_record.name,
        v_env_record.url
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        updated_at = now();

      IF v_env_record.variables IS NOT NULL THEN
        DELETE FROM pam_env_variables WHERE environment_id = v_env_id;

        v_ord := 0;
        IF jsonb_typeof(v_env_record.variables) = 'array' THEN
          FOR v_var IN
            SELECT elem
            FROM jsonb_array_elements(v_env_record.variables) AS elem
          LOOP
            IF COALESCE(v_var.elem->>'key', '') = '' THEN
              CONTINUE;
            END IF;
            INSERT INTO pam_env_variables (
              id, environment_id, key, value, sensitive, comments, sort_order
            ) VALUES (
              COALESCE(NULLIF(v_var.elem->>'id', '')::uuid, gen_random_uuid()),
              v_env_id,
              v_var.elem->>'key',
              COALESCE(v_var.elem->>'value', ''),
              COALESCE((v_var.elem->>'sensitive')::boolean, FALSE),
              CASE
                WHEN jsonb_typeof(v_var.elem->'comments') = 'array' THEN v_var.elem->'comments'
                ELSE NULL
              END,
              v_ord
            )
            ON CONFLICT (environment_id, key) DO UPDATE SET
              id = EXCLUDED.id,
              value = EXCLUDED.value,
              sensitive = EXCLUDED.sensitive,
              comments = EXCLUDED.comments,
              sort_order = EXCLUDED.sort_order,
              updated_at = now();
            v_ord := v_ord + 1;
          END LOOP;
        END IF;
      END IF;
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
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'url', e.url,
            'is_protected', e.is_protected,
            'variables', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', v.id,
                    'key', v.key,
                    'value', v.value,
                    'sensitive', v.sensitive
                  )
                  || CASE
                    WHEN v.comments IS NOT NULL THEN jsonb_build_object('comments', v.comments)
                    ELSE '{}'::jsonb
                  END
                  ORDER BY v.sort_order, v.key
                )
                FROM pam_env_variables v
                WHERE v.environment_id = e.id
              ),
              '[]'::jsonb
            )
          )
          ORDER BY e.name
        )
        FROM pam_environments e
        WHERE e.project_id = p_project_id
      ),
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
  v_env_id UUID;
  v_var RECORD;
  v_ord INT;
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
      v_env_id := COALESCE(v_env_record.id, gen_random_uuid());

      -- Legacy pam_environments.variables is unused; only name/url are updated here.
      INSERT INTO pam_environments (id, project_id, name, url)
      VALUES (
        v_env_id,
        p_project_id,
        v_env_record.name,
        v_env_record.url
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        updated_at = now();

      IF v_env_record.variables IS NOT NULL THEN
        DELETE FROM pam_env_variables WHERE environment_id = v_env_id;

        v_ord := 0;
        IF jsonb_typeof(v_env_record.variables) = 'array' THEN
          FOR v_var IN
            SELECT elem
            FROM jsonb_array_elements(v_env_record.variables) AS elem
          LOOP
            IF COALESCE(v_var.elem->>'key', '') = '' THEN
              CONTINUE;
            END IF;
            INSERT INTO pam_env_variables (
              id, environment_id, key, value, sensitive, comments, sort_order
            ) VALUES (
              COALESCE(NULLIF(v_var.elem->>'id', '')::uuid, gen_random_uuid()),
              v_env_id,
              v_var.elem->>'key',
              COALESCE(v_var.elem->>'value', ''),
              COALESCE((v_var.elem->>'sensitive')::boolean, FALSE),
              CASE
                WHEN jsonb_typeof(v_var.elem->'comments') = 'array' THEN v_var.elem->'comments'
                ELSE NULL
              END,
              v_ord
            )
            ON CONFLICT (environment_id, key) DO UPDATE SET
              id = EXCLUDED.id,
              value = EXCLUDED.value,
              sensitive = EXCLUDED.sensitive,
              comments = EXCLUDED.comments,
              sort_order = EXCLUDED.sort_order,
              updated_at = now();
            v_ord := v_ord + 1;
          END LOOP;
        END IF;
      END IF;
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
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'url', e.url,
            'is_protected', e.is_protected,
            'variables', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', v.id,
                    'key', v.key,
                    'value', v.value,
                    'sensitive', v.sensitive
                  )
                  || CASE
                    WHEN v.comments IS NOT NULL THEN jsonb_build_object('comments', v.comments)
                    ELSE '{}'::jsonb
                  END
                  ORDER BY v.sort_order, v.key
                )
                FROM pam_env_variables v
                WHERE v.environment_id = e.id
              ),
              '[]'::jsonb
            )
          )
          ORDER BY e.name
        )
        FROM pam_environments e
        WHERE e.project_id = p_project_id
      ),
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
-- Do NOT create indexes on auth.users here 閳?that requires table ownership
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
    '閺勵垰鎯侀崷銊ф瑜版洟銆夌仦鏇犮仛閵嗗本澧滈張鍝勫娇閵嗗硦ab閵嗗倸绱戦崣?閸愬懏绁撮崣顖滄暏 Supabase Test phone + 閸ュ搫鐣?OTP閿涘湏uthentication 閳?Phone 閳?Test phone numbers閿涘绱濋弮鐘绘付閻喎鐤勯惌顓濅繆閿涙稒顒滃蹇曞箚婢у啫鍟€閹?SMS Provider閵?,
    false
  ),
  (
    'auth.google_oauth_enabled',
    'false'::jsonb,
    '閺勵垰鎯侀崷銊ф瑜版洟銆夌仦鏇犮仛 Google OAuth 閹稿鎸抽妴鍌炴付閸?Supabase Auth 娑擃厼鎯庨悽?Google 閹绘劒绶甸崯鍡愨偓?,
    false
  ),
  (
    'auth.brain_pkce_enabled',
    'false'::jsonb,
    '閺勵垰鎯侀崥顖滄暏 Brain OAuth 閹哄牊娼堥惍?+ PKCE 濞翠胶鈻奸敍鍦M 閻╃绻?brain-oauth閿涘鈧倿鈧倸鎮庨張顒€婀撮幋鏍у嚒闁板秶鐤?CORS 閻ㄥ嫯娉曢崺鐔锋簚閺咁垬鈧?,
    false
  ),
  (
    'auth.brain_supabase_enabled',
    'false'::jsonb,
    '閺勵垰鎯侀崥顖滄暏 Supabase custom:brain 閼辨柨鎮庨惂璇茬秿閵嗕经rain AS 妞ゆ槒鍏樼悮?Supabase 閸忣剛缍夌拋鍧楁６閿涘本婀伴崷?localhost 闁艾鐖舵稉宥呭讲閻劊鈧?,
    false
  ),
  (
    'auth.cli_token_expires_in',
    '"30d"'::jsonb,
    'pamenv CLI Bearer JWT 閻ㄥ嫭婀侀弫鍫熸埂閿涘潰s 閺嶇厧绱￠敍灞筋洤 30d閵?d閿涘鈧倸鍩岄張鐔稿灗 pam logout 閸氬酣娓堕柌宥嗘煀閻ц缍嶉妴?,
    false
  ),
  (
    'brain_oauth.site_url',
    '""'::jsonb,
    'brain-oauth 閺堝秴濮熼弽?URL閿涘奔绗夐崥顐ｆ汞鐏忕偓鏋╅弶鐘偓鍌溿仛娓氬绱癶ttp://localhost:3122',
    false
  ),
  (
    'brain_oauth.client_id',
    '""'::jsonb,
    '閸?Brain OAuth 瀵偓閸欐垼鈧懏甯堕崚璺哄酱濞夈劌鍞介惃?client_id閵?,
    false
  ),
  (
    'brain_oauth.client_secret',
    '""'::jsonb,
    '閺堝搫鐦戠€广垺鍩涚粩顖氱槕闁姐儻绱辩痪?PKCE 閸忣剙鍙＄€广垺鍩涚粩顖氬讲閻ｆ瑧鈹栭妴鍌欑箽鐎涙ê鎮楅崝鐘茬槕鐎涙ê鍋嶉敍宀€鏅棃顫瑝閸ョ偞妯夐弰搴㈡瀮閵?,
    true
  ),
  (
    'brain_oauth.redirect_uri',
    '""'::jsonb,
    '妞よ绗?Brain OAuth 閹貉冨煑閸?redirect_uri 鐎瑰苯鍙忔稉鈧懛娣偓鍌滄殌缁岀儤妞傛妯款吇 {SITE_URL}/api/callback/brain-oauth閵?,
    false
  ),
  (
    'brain_oauth.scopes',
    '"openid profile email"'::jsonb,
    '閹哄牊娼?scope閿涘瞼鈹栭弽鐓庡瀻闂呮柣鈧倿绮拋?openid profile email閵?,
    false
  ),
  (
    'brain_oauth.locale',
    '""'::jsonb,
    '閸ュ搫鐣鹃幒鍫熸綀妞?locale閿涘潒n | zh閿涘鈧倻鏆€缁屽搫鍨担璺ㄦ暏閻劍鍩涜ぐ鎾冲 UI 鐠囶叀鈻堥妴?,
    false
  ),
  (
    'openai.api_key',
    '""'::jsonb,
    'OpenAI 閹存牕鍚嬬€瑰湱缍夐崗绛圭礄Cerebras閵嗕浇鍤滃杞板敩閻炲棛鐡戦敍澶屾畱 API 鐎靛棝鎸滈妴鍌氬鐎靛棗鐡ㄩ崒顭掔礉閻ｅ矂娼版稉宥呮礀閺勭偓妲戦弬鍥モ偓?,
    true
  ),
  (
    'openai.base_url',
    '""'::jsonb,
    'Chat Completions 閸忕厧顔愰幒銉ュ經閺嶇懓婀撮崸鈧妴鍌溿仛娓氬绱癶ttps://api.openai.com/v1',
    false
  ),
  (
    'api.cors_origins',
    '[]'::jsonb,
    '闁褰块崚鍡涙閻ㄥ嫯娉曢崺鐔烘閸氬秴宕?Origin閵嗗倻鏁ゆ禍?/oauth/token 缁涘婧€閸ｃ劎顏悙骞库偓鍌滄殌缁岄缚銆冪粈杞扮瑝閸氼垳鏁?CORS閵?,
    false
  ),
  (
    'api.cors_methods',
    '["GET","POST","OPTIONS"]'::jsonb,
    '闁褰块崚鍡涙閻?HTTP 閺傝纭堕崚妤勩€冮妴鍌炵帛鐠?GET,POST,OPTIONS閵?,
    false
  ),
  (
    'storage.preview_bucket',
    '"pam-previews"'::jsonb,
    '妞ゅ湱娲扮亸渚€娼?妫板嫯顫嶉崶鍙ョ瑐娴肩姷娈?Supabase Storage bucket 閸氬秶袨閵嗗倿绮拋?pam-previews閵?,
    false
  ),
  (
    'storage.screenshot_url_template',
    '""'::jsonb,
    '閻㈢喐鍨氭い鍦窗妫板嫯顫嶉崶鐐娴ｈ法鏁ら惃鍕焻閸ョ偓婀囬崝鈥虫勾閸р偓閿涘瘚url} 娑撳搫宕版担宥囶儊閵嗗倻鏆€缁屽搫鍨担璺ㄦ暏 Microlink 姒涙顓婚妴?,
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
  '閹靛婧€妤犲矁鐦夐惍浣稿絺闁線鈧岸浜鹃敍姝甧mory=娑撳秴褰傞惌顓濅繆閿涘牏鐖滄潻?Admin 閻╂垶甯舵い纰夌礆閿涙矘liyun=闂冨潡鍣锋禍鎴犵叚娣団槄绱橝dmin閵嗗矂妯嬮柌灞肩隘閻厺淇婇妴宥夊帳缂冾噯绱氶妴?,
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
    '閻厺淇婇張宥呭 AccessKey ID閵嗗倸缂撶拋顔诲▏閻劋绮庨惌顓濅繆閺夊啴妾洪惃?RAM 鐎涙劘澶勯崣鏋偓?,
    false
  ),
  (
    'aliyun_sms.access_key_secret',
    '""'::jsonb,
    '閻厺淇婇張宥呭 AccessKey Secret閵嗗倸濮炵€靛棗鐡ㄩ崒顭掔礉閻ｅ矂娼版稉宥呮礀閺勭偓妲戦弬鍥モ偓?,
    true
  ),
  (
    'aliyun_sms.sign_name',
    '""'::jsonb,
    '閹貉冨煑閸欐澘鍑＄€光剝鐗抽柅姘崇箖閻ㄥ嫮顒烽崥宥呮倳缁夊府绱欐稉宥嗘Ц缁涙儳鎮?ID閿涘鈧?,
    false
  ),
  (
    'aliyun_sms.template_code',
    '""'::jsonb,
    '閹貉冨煑閸欐澘鍑＄€光剝鐗抽柅姘崇箖閻ㄥ嫭膩閺?CODE閿涘矂銆忛崥顐︾崣鐠囦胶鐖滈崣姗€鍣洪妴鍌溿仛娓氬绱癝MS_123456789',
    false
  ),
  (
    'aliyun_sms.template_param_key',
    '"code"'::jsonb,
    '濡剝婢?JSON 娑擃參鐛欑拠浣虹垳鐎涙顔岄崥宥冣偓鍌炵帛鐠?code 閳?TemplateParam={"code":"123456"}閵?,
    false
  ),
  (
    'aliyun_sms.region_id',
    '"cn-hangzhou"'::jsonb,
    'DysmsAPI RegionId閵嗗倿绮拋?cn-hangzhou閵?,
    false
  ),
  (
    'aliyun_sms.endpoint',
    '"https://dysmsapi.aliyuncs.com"'::jsonb,
    'DysmsAPI 閸︽澘娼冮妴鍌炵帛鐠?https://dysmsapi.aliyuncs.com閵嗗倷绔撮懜顒佹￥闂団偓娣囶喗鏁奸妴?,
    false
  )
ON CONFLICT (key) DO NOTHING;

-- Keep phone login tab enabled when using PAM memory OTP.
INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES (
  'auth.phone_login_enabled',
  'true'::jsonb,
  '閺勵垰鎯侀崷銊ф瑜版洟銆夌仦鏇犮仛閵嗗本澧滈張鍝勫娇閵嗗硦ab閵嗕慷emory 濡€崇础娑撳鐖滈崷?Admin閵嗗矂鐛欑拠浣虹垳閻╂垶甯堕妴宥嗙叀閻绱盿liyun 濡€崇础鐠ф壆婀＄€圭偟鐓穱掳鈧?,
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
  ('user', '閺咁噣鈧氨鏁ら幋?, 'platform', 'Default registered user', TRUE),
  ('operator', '鏉╂劘鎯€', 'platform', 'Admin console read', TRUE),
  ('admin', '缁崵绮虹粻锛勬倞閸?, 'platform', 'Admin console write', TRUE),
  ('team_owner', '閸ャ垽妲﹂幍鈧張澶庘偓?, 'team', 'Team creator / owner', TRUE),
  ('team_admin', '閸ャ垽妲︾粻锛勬倞閸?, 'team', 'Team admin', TRUE),
  ('team_member', '閸ャ垽妲﹂幋鎰喅', 'team', 'Team member', TRUE);

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
  'role_id 閳?permission_key (flat).';

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
  ('admin_memory_kv_read', 'api', 'get', '/api/admin/memory-kv', 'List process Memory KV cache entries'),
  ('admin_memory_kv_write', 'api', 'post', '/api/admin/memory-kv', 'Delete process Memory KV cache entries'),
  ('admin_mail_logs_read', 'api', 'get', '/api/admin/mail-logs', 'List mail send logs'),
  ('admin_mail_test', 'api', 'post', '/api/admin/mail/test', 'Send test email'),
  ('pam_collaborators_read', 'api', 'get', '/api/pam/:projectId/collaborators', 'List project collaborators'),
  ('pam_collaborators_create', 'api', 'post', '/api/pam/:projectId/collaborators', 'Add project collaborator'),
  ('pam_collaborators_update', 'api', 'patch', '/api/pam/:projectId/collaborators/:userId', 'Update collaborator role'),
  ('pam_collaborators_delete', 'api', 'delete', '/api/pam/:projectId/collaborators/:userId', 'Remove collaborator'),
  ('pam_environments_read', 'api', 'get', '/api/pam/:projectId/environments', 'List project environments'),
  ('pam_environments_create', 'api', 'post', '/api/pam/:projectId/environments', 'Create environment'),
  ('pam_environments_delete', 'api', 'post', '/api/pam/:projectId/environments/:envId/delete', 'Delete environment'),
  ('pam_environments_variables_write', 'api', 'post', '/api/pam/:projectId/environments/:envId/variables', 'Replace environment variables'),
  ('pam_environments_export', 'api', 'get', '/api/pam/:projectId/environments/:envId/export', 'Export environment dotenv'),
  ('pam_environments_inject', 'api', 'post', '/api/pam/:projectId/environments/:envId/resolve', 'Resolve environment variables for process injection'),
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
  ('admin_locales_read'),
  ('admin_mail_logs_read')
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
  ('admin_locales_write'),
  ('admin_memory_kv_read'),
  ('admin_memory_kv_write'),
  ('admin_mail_logs_read'),
  ('admin_mail_test')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin';

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_environments_read'),
  ('pam_environments_create'),
  ('pam_environments_variables_write'),
  ('pam_environments_inject'),
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
  ('pam_environments_inject'),
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
  ('pam_environments_inject'),
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
  'Team membership; permissions via role_id 閳?pam_role_assignments.';

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

-- Backfill personal teams from project owners.
-- Personal teams hold only their owner: collaborators must never be copied in,
-- or they would gain access to every project of that owner.
DO $$
DECLARE
  r RECORD;
  v_team_id UUID;
  RID_OWNER UUID;
BEGIN
  SELECT id INTO RID_OWNER FROM public.pam_roles WHERE key = 'team_owner';

  IF RID_OWNER IS NULL THEN
    RAISE EXCEPTION 'pam_roles team_owner key missing';
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
-- Membership in another user's personal team (personal-{owner_id}) grants nothing.

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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
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



-- #############################################################################
-- SOURCE: 024-pam-mail-service.sql
-- #############################################################################

-- Transactional mail (memory | resend) + forgot password; independent from Supabase Auth mails.

-- ---------------------------------------------------------------------------
-- 1) Mail send audit
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pam_mail_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL
    CHECK (template IN ('test', 'password_reset', 'password_changed')),
  provider TEXT NOT NULL CHECK (provider IN ('memory', 'resend')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id TEXT,
  error TEXT,
  body_text TEXT,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_mail_logs IS
  'Transactional mail audit (memory | resend). Admin mail logs page reads this.';
COMMENT ON COLUMN public.pam_mail_logs.body_text IS
  'Plain-text body, only stored for memory provider (dev/test). Null for real providers.';

CREATE INDEX IF NOT EXISTS idx_pam_mail_logs_created
  ON public.pam_mail_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pam_mail_logs_email_template_created
  ON public.pam_mail_logs (to_email, template, created_at DESC);

ALTER TABLE public.pam_mail_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2) Password reset tokens (link flow; only SHA-256 hash is stored)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pam_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_password_reset_tokens IS
  'Forgot-password reset links. Single use; unused tokens are invalidated after a successful reset.';

CREATE INDEX IF NOT EXISTS idx_pam_password_reset_tokens_user_created
  ON public.pam_password_reset_tokens (user_id, created_at DESC);

ALTER TABLE public.pam_password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3) Revoke all browser sessions (pam_session JWT issued before this is rejected)
-- ---------------------------------------------------------------------------

ALTER TABLE public.pam_users
  ADD COLUMN IF NOT EXISTS sessions_revoked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.pam_users.sessions_revoked_at IS
  'Session JWTs with iat before this time are rejected (set after password reset).';

-- ---------------------------------------------------------------------------
-- External login identities (brain-oauth sub 閳?PAM user)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.pam_user_identities (
  provider TEXT NOT NULL,
  external_user_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  identity_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (provider, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pam_user_identities_user
  ON public.pam_user_identities (user_id);

COMMENT ON TABLE public.pam_user_identities IS
  'External login identities mapped to a PAM user (provider = brain: external_user_id is the brain-oauth sub).';

COMMENT ON COLUMN public.pam_user_identities.identity_data IS
  'Provider-specific snapshot from the latest login, e.g. Brain: {"env": "production", "account": "a@x.com"}.';

ALTER TABLE public.pam_user_identities ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Environment variable access audit (resolve / export); never stores values
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS public.pam_env_access_logs;

CREATE TABLE public.pam_env_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES pam_projects (id) ON DELETE CASCADE,
  environment_id UUID REFERENCES pam_environments (id) ON DELETE SET NULL,
  environment_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('resolve', 'export')),
  key_count INT NOT NULL DEFAULT 0,
  client TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_env_access_logs IS
  'Who read which environment and when (resolve = pamenv run, export = pull / render without sensitive values). Service-role only.';

CREATE INDEX idx_pam_env_access_logs_env_created
  ON public.pam_env_access_logs (environment_id, created_at DESC);

CREATE INDEX idx_pam_env_access_logs_project_created
  ON public.pam_env_access_logs (project_id, created_at DESC);

ALTER TABLE public.pam_env_access_logs ENABLE ROW LEVEL SECURITY;



-- #############################################################################
-- pam_search_projects: mine / writable / compact view (see 003-pam-search-access-filters.sql)
-- #############################################################################

-- =============================================================================
-- pam_search_projects: server-side mine / writable + compact view
--
-- filters.mine / filters.writable (via RPC args) keep pagination correct.
-- p_view = 'compact' returns CLI-sized rows (no card fields).
-- Safe to re-run. Keep in sync with 000-pam-full-schema.sql.
-- =============================================================================

DROP FUNCTION IF EXISTS pam_search_projects(uuid, text, text, text, int, int, boolean, boolean);
DROP FUNCTION IF EXISTS pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text);
DROP FUNCTION IF EXISTS pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text);
DROP FUNCTION IF EXISTS pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text, boolean, boolean, text);

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
  p_sort_order text DEFAULT 'desc',
  p_mine boolean DEFAULT FALSE,
  p_writable boolean DEFAULT FALSE,
  p_view text DEFAULT 'full'
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
  v_mine boolean := coalesce(p_mine, false);
  v_writable boolean := coalesce(p_writable, false);
  v_view text := lower(coalesce(nullif(trim(coalesce(p_view, '')), ''), 'full'));
BEGIN
  IF v_sort_by NOT IN ('created_at', 'updated_at') THEN
    v_sort_by := 'created_at';
  END IF;
  IF v_sort_order NOT IN ('asc', 'desc') THEN
    v_sort_order := 'desc';
  END IF;
  IF v_view NOT IN ('full', 'compact') THEN
    v_view := 'full';
  END IF;

  v_offset := (v_page - 1) * v_page_size;
  v_keyword := nullif(trim(coalesce(p_keyword, '')), '');

  IF (p_visibility = 'private' OR v_mine OR v_writable) AND p_user_id IS NULL THEN
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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
            )
          )
        ))
      )
      AND (
        NOT v_mine
        OR p.owner_id = p_user_id
      )
      AND (
        NOT v_writable
        OR p.owner_id = p_user_id
        OR (
          p.team_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM pam_role_team_members m
            JOIN pam_role_teams t ON t.id = m.team_id
            WHERE m.team_id = p.team_id
              AND m.user_id = p_user_id
              AND m.status = 'active'
              AND (
                t.slug NOT LIKE 'personal-%'
                OR t.slug = 'personal-' || p_user_id::text
              )
          )
        )
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR (
          v_view = 'full'
          AND (
            coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
            OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
            OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
            OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
          )
        )
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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
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
              JOIN pam_role_teams t ON t.id = m.team_id
              WHERE m.team_id = p.team_id
                AND m.user_id = p_user_id
                AND m.status = 'active'
                AND (
                  t.slug NOT LIKE 'personal-%'
                  OR t.slug = 'personal-' || p_user_id::text
                )
            )
          )
        ))
      )
      AND (
        NOT v_mine
        OR p.owner_id = p_user_id
      )
      AND (
        NOT v_writable
        OR p.owner_id = p_user_id
        OR (
          p.team_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM pam_role_team_members m
            JOIN pam_role_teams t ON t.id = m.team_id
            WHERE m.team_id = p.team_id
              AND m.user_id = p_user_id
              AND m.status = 'active'
              AND (
                t.slug NOT LIKE 'personal-%'
                OR t.slug = 'personal-' || p_user_id::text
              )
          )
        )
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR (
          v_view = 'full'
          AND (
            coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
            OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
            OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
            OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
          )
        )
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
      CASE
        WHEN v_view = 'compact' THEN
          jsonb_build_object(
            'id', row.id,
            'slug', row.slug,
            'name', row.name,
            'environments', coalesce(row.envs, '[]'::jsonb)
          )
          || CASE
            WHEN p_include_owner_id THEN jsonb_build_object('owner_id', row.owner_id)
            ELSE '{}'::jsonb
          END
          || CASE
            WHEN row.team_id IS NOT NULL THEN jsonb_build_object('team_id', row.team_id)
            ELSE '{}'::jsonb
          END
        ELSE
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
      END
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM (
    SELECT
      p.*,
      (
        SELECT jsonb_agg(
          CASE
            WHEN v_view = 'compact' THEN
              jsonb_build_object('id', e.id, 'name', e.name)
            ELSE
              jsonb_build_object('id', e.id, 'name', e.name, 'url', e.url)
          END
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

REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text, boolean, boolean, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text, boolean, boolean, text) TO service_role;
