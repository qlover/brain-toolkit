-- =============================================================================
-- PAM CI OIDC：扩展 provider 支持 vercel
-- Safe to re-run. Apply after 004-pam-ci-oidc.sql.
-- =============================================================================

ALTER TABLE public.pam_ci_oidc_bindings
  DROP CONSTRAINT IF EXISTS pam_ci_oidc_bindings_provider_check;

ALTER TABLE public.pam_ci_oidc_bindings
  ADD CONSTRAINT pam_ci_oidc_bindings_provider_check
  CHECK (provider IN ('github', 'vercel'));

COMMENT ON TABLE public.pam_ci_oidc_bindings IS
  'CI OIDC trust: external resource key → project CI user. '
  'repository = GitHub owner/repo or Vercel teamSlug/projectName.';

COMMENT ON COLUMN public.pam_ci_oidc_bindings.repository IS
  'External resource key: GitHub owner/repo or Vercel team/project.';
