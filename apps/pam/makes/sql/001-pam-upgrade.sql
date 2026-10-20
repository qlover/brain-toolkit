-- =============================================================================
-- PAM upgrade for EXISTING databases (single script, safe to re-run)
--
-- 000-pam-full-schema.sql is for fresh installs only (it drops tables).
-- This file brings an existing DB up to the same schema without data loss.
-- Keep in sync with 000-pam-full-schema.sql, shared/config/pamTables.ts and
-- shared/auth/permissionKeys.ts
-- =============================================================================


-- #############################################################################
-- 1) Memory KV admin inspect (role key `admin` only)
-- #############################################################################

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description)
VALUES
  ('admin_memory_kv_read', 'api', 'get', '/api/admin/memory-kv', 'List process Memory KV cache entries'),
  ('admin_memory_kv_write', 'api', 'post', '/api/admin/memory-kv', 'Delete process Memory KV cache entries')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_memory_kv_read'),
  ('admin_memory_kv_write')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;


-- #############################################################################
-- 2) Transactional mail + forgot password (independent from Supabase Auth mails)
-- #############################################################################
-- Site settings `mail.*` are seeded by the app from code definitions.

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

-- Password reset links; only the SHA-256 hash is stored.
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

-- Revoke all browser sessions (pam_session JWT issued before this is rejected).
ALTER TABLE public.pam_users
  ADD COLUMN IF NOT EXISTS sessions_revoked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.pam_users.sessions_revoked_at IS
  'Session JWTs with iat before this time are rejected (set after password reset).';

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description)
VALUES
  ('admin_mail_logs_read', 'api', 'get', '/api/admin/mail-logs', 'List mail send logs'),
  ('admin_mail_test', 'api', 'post', '/api/admin/mail/test', 'Send test email')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_mail_logs_read')
) AS v(permission_key) ON TRUE
WHERE r.key = 'operator'
ON CONFLICT DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_mail_logs_read'),
  ('admin_mail_test')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;


-- #############################################################################
-- 3) Remembered OAuth consent ("trust this app" on one device)
-- #############################################################################
-- Early drafts had no device_id; such a table is recreated (trust rows are
-- safe to lose — users just see the consent page once more).

DO $$
BEGIN
  IF to_regclass('public.pam_oauth_consent_grants') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pam_oauth_consent_grants'
        AND column_name = 'device_id'
    ) THEN
    DROP TABLE public.pam_oauth_consent_grants CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.pam_oauth_consent_grants (
  user_id text NOT NULL,
  client_id text NOT NULL REFERENCES public.pam_oauth_clients (client_id) ON DELETE CASCADE,
  device_id text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  user_agent text,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, client_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_pam_oauth_consent_grants_user
  ON public.pam_oauth_consent_grants (user_id);

COMMENT ON TABLE public.pam_oauth_consent_grants IS 'Remembered consent ("trust this app") per user + client + device; skip the authorize page for these scopes until expires_at.';
COMMENT ON COLUMN public.pam_oauth_consent_grants.device_id IS 'Random id from the httpOnly pam_oauth_device cookie.';

ALTER TABLE public.pam_oauth_consent_grants ENABLE ROW LEVEL SECURITY;


-- #############################################################################
-- 4) External login identities (brain-oauth sub → PAM user)
-- #############################################################################
-- Before this table, PAM stored the brain-oauth `sub` directly as pam_users.id.

CREATE TABLE IF NOT EXISTS public.pam_user_identities (
  provider text NOT NULL,
  external_user_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  PRIMARY KEY (provider, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pam_user_identities_user
  ON public.pam_user_identities (user_id);

COMMENT ON TABLE public.pam_user_identities IS
  'External login identities mapped to a PAM user (provider = brain: external_user_id is the brain-oauth sub).';

ALTER TABLE public.pam_user_identities ENABLE ROW LEVEL SECURITY;

-- Backfill legacy Brain users (pam_users.id = brain-oauth sub). Works before
-- or after brain-oauth-schema.sql renames links.auth_user_id → user_id
-- (the UUIDs are preserved either way).
DO $$
DECLARE
  link_col text;
BEGIN
  IF to_regclass('public.brain_oauth_user_links') IS NULL THEN
    RETURN;
  END IF;

  SELECT column_name INTO link_col
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'brain_oauth_user_links'
    AND column_name IN ('auth_user_id', 'user_id')
  LIMIT 1;

  IF link_col IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format(
    'INSERT INTO public.pam_user_identities (provider, external_user_id, user_id)
     SELECT DISTINCT ''brain'', p.id::text, p.id
     FROM public.pam_users p
     JOIN public.brain_oauth_user_links l ON l.%I = p.id
     ON CONFLICT (provider, external_user_id) DO NOTHING',
    link_col
  );
END $$;

-- #############################################################################
-- 5) Provider snapshot on external login identities (account page)
-- #############################################################################
-- Existing rows are filled on their next login.

ALTER TABLE public.pam_user_identities
  ADD COLUMN IF NOT EXISTS identity_data jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.pam_user_identities.identity_data IS
  'Provider-specific snapshot from the latest login, e.g. Brain: {"env": "production", "account": "a@x.com"}.';

-- #############################################################################
-- 6) Personal teams hold only their owner
-- #############################################################################
-- An earlier backfill copied project collaborators into the owner's personal
-- team, granting them every project of that owner. Slug is personal-{owner_id}.

DELETE FROM public.pam_role_team_members m
USING public.pam_role_teams t
WHERE m.team_id = t.id
  AND t.slug LIKE 'personal-%'
  AND m.user_id::text <> substring(t.slug FROM 10);

-- #############################################################################
-- 7) pam_search_projects: ignore membership in another user's personal team
-- #############################################################################
-- Keep in sync with the latest pam_search_projects in 000-pam-full-schema.sql.

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

REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) TO service_role;

-- #############################################################################
-- 8) pamenv v2: inject permission, export for admin/owner only, protected env,
--    access audit
-- #############################################################################
-- team_member loses pam_environments_export (pull/render); it keeps
-- pam_environments_inject (pamenv run).

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description)
VALUES
  ('pam_environments_inject', 'api', 'post', '/api/pam/:projectId/environments/:envId/resolve', 'Resolve environment variables for process injection')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, 'pam_environments_inject'
FROM public.pam_roles r
WHERE r.key IN ('team_member', 'team_admin', 'team_owner')
ON CONFLICT DO NOTHING;

DELETE FROM public.pam_role_assignments a
USING public.pam_roles r
WHERE a.role_id = r.id
  AND r.key = 'team_member'
  AND a.permission_key = 'pam_environments_export';

ALTER TABLE public.pam_environments
  ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.pam_environments.is_protected IS
  'Protected env: resolve (pamenv run) also requires pam_environments_export.';

CREATE TABLE IF NOT EXISTS public.pam_env_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.pam_projects (id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.pam_environments (id) ON DELETE SET NULL,
  environment_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('resolve', 'export')),
  key_count INT NOT NULL DEFAULT 0,
  client TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pam_env_access_logs IS
  'Who read which environment and when (resolve = pamenv run, export = pull / render without sensitive values). Service-role only.';

CREATE INDEX IF NOT EXISTS idx_pam_env_access_logs_env_created
  ON public.pam_env_access_logs (environment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pam_env_access_logs_project_created
  ON public.pam_env_access_logs (project_id, created_at DESC);

ALTER TABLE public.pam_env_access_logs ENABLE ROW LEVEL SECURITY;
