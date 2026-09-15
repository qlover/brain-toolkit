-- Teams (institutions) under pam_role_* naming. Additive only.
-- Does NOT drop pam_project_collaborators or pam_projects.owner_id.
-- Replaces earlier pam_teams / pam_team_members draft names if present.

-- Detach project FK so old team tables can be dropped/renamed safely
ALTER TABLE public.pam_projects
  DROP CONSTRAINT IF EXISTS pam_projects_team_id_fkey;

DROP TABLE IF EXISTS public.pam_role_team_members;
DROP TABLE IF EXISTS public.pam_team_members;
DROP TABLE IF EXISTS public.pam_role_teams;
DROP TABLE IF EXISTS public.pam_teams;

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
  'Institution / team container. Projects attach via pam_projects.team_id.';

CREATE TABLE public.pam_role_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.pam_role_teams (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
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

COMMENT ON TABLE public.pam_role_team_members IS
  'Team membership; org roles map via pam_role_assignments(scope=org).';

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

-- Ensure team_id column exists, then point FK at pam_role_teams
ALTER TABLE public.pam_projects
  ADD COLUMN IF NOT EXISTS team_id UUID;

-- Clear stale ids from previous draft team table (safe: backfill runs below)
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
  'Owning pam_role_teams row. Null = legacy/unassigned. Access prefers team membership when set.';

-- Backfill personal teams + members from project owners / collaborators
DO $$
DECLARE
  r RECORD;
  v_team_id UUID;
  c RECORD;
  v_existing TEXT;
  v_rank INT;
  v_new_rank INT;
BEGIN
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

      INSERT INTO public.pam_role_team_members (team_id, user_id, role, invited_by)
      VALUES (v_team_id, r.owner_id, 'owner', r.owner_id)
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
      SELECT role INTO v_existing
      FROM public.pam_role_team_members
      WHERE team_id = v_team_id
        AND user_id = c.user_id
        AND status = 'active';

      v_rank := CASE v_existing
        WHEN 'owner' THEN 3
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 1
        ELSE 0
      END;
      v_new_rank := CASE c.role
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 1
        ELSE 0
      END;

      IF v_existing IS NULL THEN
        INSERT INTO public.pam_role_team_members (team_id, user_id, role, invited_by)
        VALUES (v_team_id, c.user_id, c.role, c.invited_by)
        ON CONFLICT (team_id, user_id) DO NOTHING;
      ELSIF v_new_rank > v_rank AND v_existing <> 'owner' THEN
        UPDATE public.pam_role_team_members
        SET role = c.role
        WHERE team_id = v_team_id
          AND user_id = c.user_id;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Team API permission defs + org role grants
INSERT INTO public.pam_role_permissions (uid, slug, type, method, path, description) VALUES
  ('get_/api/pam/teams', 'get_api_pam_teams', 'api', 'get', '/api/pam/teams', 'List my teams'),
  ('post_/api/pam/teams', 'post_api_pam_teams', 'api', 'post', '/api/pam/teams', 'Create team'),
  ('get_/api/pam/teams/:teamId', 'get_api_pam_teams_teamId', 'api', 'get', '/api/pam/teams/:teamId', 'Get team detail'),
  ('post_/api/pam/teams/:teamId/members', 'post_api_pam_teams_teamId_members', 'api', 'post', '/api/pam/teams/:teamId/members', 'Add team member'),
  ('patch_/api/pam/teams/:teamId/members/:userId', 'patch_api_pam_teams_teamId_members_userId', 'api', 'patch', '/api/pam/teams/:teamId/members/:userId', 'Update team member role'),
  ('delete_/api/pam/teams/:teamId/members/:userId', 'delete_api_pam_teams_teamId_members_userId', 'api', 'delete', '/api/pam/teams/:teamId/members/:userId', 'Remove team member'),
  ('post_/api/pam/teams/:teamId/projects', 'post_api_pam_teams_teamId_projects', 'api', 'post', '/api/pam/teams/:teamId/projects', 'Attach project to team')
ON CONFLICT (uid) DO UPDATE SET
  slug = COALESCE(public.pam_role_permissions.slug, EXCLUDED.slug);

INSERT INTO public.pam_role_assignments (scope, role_key, permission_uid) VALUES
  ('org', 'member', 'get_/api/pam/teams/:teamId'),
  ('org', 'admin', 'get_/api/pam/teams/:teamId'),
  ('org', 'admin', 'post_/api/pam/teams/:teamId/members'),
  ('org', 'admin', 'patch_/api/pam/teams/:teamId/members/:userId'),
  ('org', 'admin', 'delete_/api/pam/teams/:teamId/members/:userId'),
  ('org', 'admin', 'post_/api/pam/teams/:teamId/projects'),
  ('org', 'owner', 'get_/api/pam/teams/:teamId'),
  ('org', 'owner', 'post_/api/pam/teams/:teamId/members'),
  ('org', 'owner', 'patch_/api/pam/teams/:teamId/members/:userId'),
  ('org', 'owner', 'delete_/api/pam/teams/:teamId/members/:userId'),
  ('org', 'owner', 'post_/api/pam/teams/:teamId/projects')
ON CONFLICT DO NOTHING;

-- Admin users: system-role API (idempotent if 021 already seeded)
INSERT INTO public.pam_role_permissions (uid, slug, type, method, path, description) VALUES
  ('patch_/api/admin/users/:userId/system-role', 'patch_api_admin_users_userId_system_role', 'api', 'patch', '/api/admin/users/:userId/system-role', 'Set system role user|operator|admin')
ON CONFLICT (uid) DO UPDATE SET
  slug = COALESCE(public.pam_role_permissions.slug, EXCLUDED.slug);

INSERT INTO public.pam_role_assignments (scope, role_key, permission_uid) VALUES
  ('system', 'admin', 'patch_/api/admin/users/:userId/system-role')
ON CONFLICT DO NOTHING;
