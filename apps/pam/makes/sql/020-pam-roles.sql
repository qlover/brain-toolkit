-- PAM roles / permissions / teams (single rewrite script).
-- Safe to re-run on feat branch. Resolves role_id by pam_roles.key (no hardcoded UUIDs).
-- Keep in sync with apps/pam/shared/auth/permissionUid.ts

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
-- 2) Permission catalog (uid + slug)
-- ---------------------------------------------------------------------------

CREATE TABLE public.pam_role_permissions (
  uid TEXT PRIMARY KEY,
  slug TEXT,
  type TEXT NOT NULL DEFAULT 'api' CHECK (type IN ('api', 'page', 'feature')),
  method TEXT NOT NULL CHECK (method IN ('get', 'post', 'patch', 'put', 'delete')),
  path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pam_role_permissions_uid_matches CHECK (
    uid = lower(method) || '_' || path
  )
);

CREATE UNIQUE INDEX idx_pam_role_permissions_slug
  ON public.pam_role_permissions (slug)
  WHERE slug IS NOT NULL AND slug <> '';

COMMENT ON TABLE public.pam_role_permissions IS
  'Permission catalog; uid is auth PK; slug is i18n id permission:{slug}.';

COMMENT ON COLUMN public.pam_role_permissions.slug IS
  'Stable id for i18n key permission:{slug}; derived from uid.';

COMMENT ON COLUMN public.pam_role_permissions.description IS
  'Optional DB note for query/docs; UI uses permission:{slug} translations.';

CREATE TABLE public.pam_role_assignments (
  role_id UUID NOT NULL REFERENCES public.pam_roles (id) ON DELETE CASCADE,
  permission_uid TEXT NOT NULL REFERENCES public.pam_role_permissions (uid) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_uid)
);

CREATE INDEX idx_pam_role_assignments_role_id
  ON public.pam_role_assignments (role_id);

COMMENT ON TABLE public.pam_role_assignments IS
  'role_id → permission uid (flat).';

INSERT INTO public.pam_role_permissions (uid, slug, type, method, path, description) VALUES
  ('get_/api/admin/users', 'get_api_admin_users', 'api', 'get', '/api/admin/users', 'List platform users'),
  ('patch_/api/admin/users/:userId/platform-admin', 'patch_api_admin_users_userId_platform_admin', 'api', 'patch', '/api/admin/users/:userId/platform-admin', 'Set platform admin / system role'),
  ('patch_/api/admin/users/:userId/system-role', 'patch_api_admin_users_userId_system_role', 'api', 'patch', '/api/admin/users/:userId/system-role', 'Set platform role'),
  ('get_/api/admin/roles', 'get_api_admin_roles', 'api', 'get', '/api/admin/roles', 'List roles and assignments'),
  ('patch_/api/admin/roles', 'patch_api_admin_roles', 'api', 'patch', '/api/admin/roles', 'Replace role permission assignments'),
  ('get_/api/admin/request-logs', 'get_api_admin_request_logs', 'api', 'get', '/api/admin/request-logs', 'Read request audit logs'),
  ('get_/api/admin/phone-otps', 'get_api_admin_phone_otps', 'api', 'get', '/api/admin/phone-otps', 'List phone OTP records'),
  ('get_/api/admin/site-settings', 'get_api_admin_site_settings', 'api', 'get', '/api/admin/site-settings', 'Read site settings'),
  ('patch_/api/admin/site-settings', 'patch_api_admin_site_settings', 'api', 'patch', '/api/admin/site-settings', 'Update site settings'),
  ('get_/api/pam/:projectId/collaborators', 'get_api_pam_projectId_collaborators', 'api', 'get', '/api/pam/:projectId/collaborators', 'List project collaborators'),
  ('post_/api/pam/:projectId/collaborators', 'post_api_pam_projectId_collaborators', 'api', 'post', '/api/pam/:projectId/collaborators', 'Add project collaborator'),
  ('patch_/api/pam/:projectId/collaborators/:userId', 'patch_api_pam_projectId_collaborators_userId', 'api', 'patch', '/api/pam/:projectId/collaborators/:userId', 'Update collaborator role'),
  ('delete_/api/pam/:projectId/collaborators/:userId', 'delete_api_pam_projectId_collaborators_userId', 'api', 'delete', '/api/pam/:projectId/collaborators/:userId', 'Remove collaborator'),
  ('post_/api/pam/:projectId/environments', 'post_api_pam_projectId_environments', 'api', 'post', '/api/pam/:projectId/environments', 'Create environment'),
  ('post_/api/pam/:projectId/environments/:envId/delete', 'post_api_pam_projectId_environments_envId_delete', 'api', 'post', '/api/pam/:projectId/environments/:envId/delete', 'Delete environment'),
  ('post_/api/pam/:projectId/environments/:envId/variables', 'post_api_pam_projectId_environments_envId_variables', 'api', 'post', '/api/pam/:projectId/environments/:envId/variables', 'Replace environment variables'),
  ('get_/api/pam/:projectId/environments/:envId/export', 'get_api_pam_projectId_environments_envId_export', 'api', 'get', '/api/pam/:projectId/environments/:envId/export', 'Export environment dotenv'),
  ('post_/api/pam/delete/:id', 'post_api_pam_delete_id', 'api', 'post', '/api/pam/delete/:id', 'Delete project'),
  ('post_/api/pam/edit/:id', 'post_api_pam_edit_id', 'api', 'post', '/api/pam/edit/:id', 'Update project'),
  ('post_/api/pam/transfer/:id', 'post_api_pam_transfer_id', 'api', 'post', '/api/pam/transfer/:id', 'Transfer project ownership'),
  ('post_/api/pam/preview-image/:id', 'post_api_pam_preview_image_id', 'api', 'post', '/api/pam/preview-image/:id', 'Refresh project preview image'),
  ('get_/api/pam/teams', 'get_api_pam_teams', 'api', 'get', '/api/pam/teams', 'List my teams'),
  ('post_/api/pam/teams', 'post_api_pam_teams', 'api', 'post', '/api/pam/teams', 'Create team'),
  ('get_/api/pam/teams/:teamId', 'get_api_pam_teams_teamId', 'api', 'get', '/api/pam/teams/:teamId', 'Get team detail'),
  ('post_/api/pam/teams/:teamId/members', 'post_api_pam_teams_teamId_members', 'api', 'post', '/api/pam/teams/:teamId/members', 'Add team member'),
  ('patch_/api/pam/teams/:teamId/members/:userId', 'patch_api_pam_teams_teamId_members_userId', 'api', 'patch', '/api/pam/teams/:teamId/members/:userId', 'Update team member role'),
  ('delete_/api/pam/teams/:teamId/members/:userId', 'delete_api_pam_teams_teamId_members_userId', 'api', 'delete', '/api/pam/teams/:teamId/members/:userId', 'Remove team member'),
  ('post_/api/pam/teams/:teamId/projects', 'post_api_pam_teams_teamId_projects', 'api', 'post', '/api/pam/teams/:teamId/projects', 'Attach project to team');

-- ---------------------------------------------------------------------------
-- 3) Default assignments (by role key)
-- ---------------------------------------------------------------------------

-- platform user: create / list teams
INSERT INTO public.pam_role_assignments (role_id, permission_uid)
SELECT r.id, v.uid
FROM public.pam_roles r
JOIN (VALUES
  ('get_/api/pam/teams'),
  ('post_/api/pam/teams')
) AS v(uid) ON TRUE
WHERE r.key = 'user';

-- platform operator (app teams + admin read)
INSERT INTO public.pam_role_assignments (role_id, permission_uid)
SELECT r.id, v.uid
FROM public.pam_roles r
JOIN (VALUES
  ('get_/api/pam/teams'),
  ('post_/api/pam/teams'),
  ('get_/api/admin/users'),
  ('get_/api/admin/roles'),
  ('get_/api/admin/request-logs'),
  ('get_/api/admin/phone-otps'),
  ('get_/api/admin/site-settings')
) AS v(uid) ON TRUE
WHERE r.key = 'operator';

-- platform admin (app teams + admin read/write)
INSERT INTO public.pam_role_assignments (role_id, permission_uid)
SELECT r.id, v.uid
FROM public.pam_roles r
JOIN (VALUES
  ('get_/api/pam/teams'),
  ('post_/api/pam/teams'),
  ('get_/api/admin/users'),
  ('patch_/api/admin/users/:userId/platform-admin'),
  ('patch_/api/admin/users/:userId/system-role'),
  ('get_/api/admin/roles'),
  ('patch_/api/admin/roles'),
  ('get_/api/admin/request-logs'),
  ('get_/api/admin/phone-otps'),
  ('get_/api/admin/site-settings'),
  ('patch_/api/admin/site-settings')
) AS v(uid) ON TRUE
WHERE r.key = 'admin';

-- team_member
INSERT INTO public.pam_role_assignments (role_id, permission_uid)
SELECT r.id, v.uid
FROM public.pam_roles r
JOIN (VALUES
  ('get_/api/pam/:projectId/collaborators'),
  ('post_/api/pam/:projectId/environments'),
  ('post_/api/pam/:projectId/environments/:envId/variables'),
  ('get_/api/pam/:projectId/environments/:envId/export'),
  ('post_/api/pam/edit/:id'),
  ('post_/api/pam/preview-image/:id'),
  ('get_/api/pam/teams/:teamId')
) AS v(uid) ON TRUE
WHERE r.key = 'team_member';

-- team_admin + team_owner
INSERT INTO public.pam_role_assignments (role_id, permission_uid)
SELECT r.id, v.uid
FROM public.pam_roles r
JOIN (VALUES
  ('get_/api/pam/:projectId/collaborators'),
  ('post_/api/pam/:projectId/collaborators'),
  ('patch_/api/pam/:projectId/collaborators/:userId'),
  ('delete_/api/pam/:projectId/collaborators/:userId'),
  ('post_/api/pam/:projectId/environments'),
  ('post_/api/pam/:projectId/environments/:envId/delete'),
  ('post_/api/pam/:projectId/environments/:envId/variables'),
  ('get_/api/pam/:projectId/environments/:envId/export'),
  ('post_/api/pam/delete/:id'),
  ('post_/api/pam/edit/:id'),
  ('post_/api/pam/transfer/:id'),
  ('post_/api/pam/preview-image/:id'),
  ('get_/api/pam/teams/:teamId'),
  ('post_/api/pam/teams/:teamId/members'),
  ('patch_/api/pam/teams/:teamId/members/:userId'),
  ('delete_/api/pam/teams/:teamId/members/:userId'),
  ('post_/api/pam/teams/:teamId/projects')
) AS v(uid) ON TRUE
WHERE r.key IN ('team_admin', 'team_owner');

-- ---------------------------------------------------------------------------
-- 4) pam_users.role_id (drop legacy system_role)
-- ---------------------------------------------------------------------------

ALTER TABLE public.pam_users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE public.pam_users DROP CONSTRAINT IF EXISTS pam_users_system_role_check;

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
ALTER TABLE public.pam_users DROP CONSTRAINT IF EXISTS pam_users_role_id_fkey;
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
