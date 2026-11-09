-- =============================================================================
-- PAM CI OIDC (GitHub Actions): team_ci_runner role + project bindings
-- Safe to re-run. Apply after 000 / 001.
-- =============================================================================

-- #############################################################################
-- 1) team_ci_runner：仅 inject（+ teams_read）
-- #############################################################################

INSERT INTO public.pam_roles (key, name, kind, description, is_system)
VALUES (
  'team_ci_runner',
  'CI Runner',
  'team',
  'GitHub Actions / OIDC CI identity: inject only',
  TRUE
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('pam_environments_inject'),
  ('pam_teams_read')
) AS v(permission_key) ON TRUE
WHERE r.key = 'team_ci_runner'
ON CONFLICT DO NOTHING;

-- #############################################################################
-- 2) pam_ci_oidc_bindings
-- #############################################################################

CREATE TABLE IF NOT EXISTS public.pam_ci_oidc_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.pam_projects (id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'github'
    CHECK (provider IN ('github', 'vercel')),
  repository TEXT NOT NULL,
  ci_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  audience TEXT,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pam_ci_oidc_bindings_repository_nonempty
    CHECK (length(trim(repository)) > 0),
  CONSTRAINT pam_ci_oidc_bindings_repository_format
    CHECK (repository ~ '^[^/\s]+/[^/\s]+$')
);

COMMENT ON TABLE public.pam_ci_oidc_bindings IS
  'CI OIDC trust: external resource key → project CI user. '
  'repository = GitHub owner/repo or Vercel teamSlug/projectName.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_pam_ci_oidc_bindings_provider_repo
  ON public.pam_ci_oidc_bindings (provider, repository);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pam_ci_oidc_bindings_project_provider
  ON public.pam_ci_oidc_bindings (project_id, provider);

CREATE INDEX IF NOT EXISTS idx_pam_ci_oidc_bindings_ci_user
  ON public.pam_ci_oidc_bindings (ci_user_id);

ALTER TABLE public.pam_ci_oidc_bindings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.pam_ci_oidc_bindings_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pam_ci_oidc_bindings_updated_at
  ON public.pam_ci_oidc_bindings;
CREATE TRIGGER trigger_pam_ci_oidc_bindings_updated_at
BEFORE UPDATE ON public.pam_ci_oidc_bindings
FOR EACH ROW EXECUTE FUNCTION public.pam_ci_oidc_bindings_set_updated_at();
