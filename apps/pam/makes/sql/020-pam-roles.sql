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
  ('pam_teams_projects_attach', 'api', 'post', '/api/pam/teams/:teamId/projects', 'Attach project to team');

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
  ('admin_site_settings_read')
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
  ('admin_site_settings_write')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin';

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_collaborators_read'),
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
  ('pam_collaborators_read'),
  ('pam_collaborators_create'),
  ('pam_collaborators_update'),
  ('pam_collaborators_delete'),
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
  ('pam_teams_projects_attach')
) AS v(permission_key) ON TRUE
WHERE r.key IN ('team_admin', 'team_owner');

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
