-- Additive: permission slug id for i18n (`permission:{slug}`).
-- description stays for DB query/docs; UI uses slug → i18n.

ALTER TABLE public.pam_role_permissions
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.pam_role_permissions SET slug = 'get_api_admin_users'
  WHERE uid = 'get_/api/admin/users' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'patch_api_admin_users_userId_platform_admin'
  WHERE uid = 'patch_/api/admin/users/:userId/platform-admin' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'patch_api_admin_users_userId_system_role'
  WHERE uid = 'patch_/api/admin/users/:userId/system-role' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_admin_roles'
  WHERE uid = 'get_/api/admin/roles' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'patch_api_admin_roles'
  WHERE uid = 'patch_/api/admin/roles' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_admin_request_logs'
  WHERE uid = 'get_/api/admin/request-logs' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_admin_phone_otps'
  WHERE uid = 'get_/api/admin/phone-otps' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_admin_site_settings'
  WHERE uid = 'get_/api/admin/site-settings' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'patch_api_admin_site_settings'
  WHERE uid = 'patch_/api/admin/site-settings' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_pam_projectId_collaborators'
  WHERE uid = 'get_/api/pam/:projectId/collaborators' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_projectId_collaborators'
  WHERE uid = 'post_/api/pam/:projectId/collaborators' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'patch_api_pam_projectId_collaborators_userId'
  WHERE uid = 'patch_/api/pam/:projectId/collaborators/:userId' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'delete_api_pam_projectId_collaborators_userId'
  WHERE uid = 'delete_/api/pam/:projectId/collaborators/:userId' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_projectId_environments'
  WHERE uid = 'post_/api/pam/:projectId/environments' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_projectId_environments_envId_delete'
  WHERE uid = 'post_/api/pam/:projectId/environments/:envId/delete' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_projectId_environments_envId_variables'
  WHERE uid = 'post_/api/pam/:projectId/environments/:envId/variables' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_pam_projectId_environments_envId_export'
  WHERE uid = 'get_/api/pam/:projectId/environments/:envId/export' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_delete_id'
  WHERE uid = 'post_/api/pam/delete/:id' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_edit_id'
  WHERE uid = 'post_/api/pam/edit/:id' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_transfer_id'
  WHERE uid = 'post_/api/pam/transfer/:id' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_preview_image_id'
  WHERE uid = 'post_/api/pam/preview-image/:id' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_pam_teams'
  WHERE uid = 'get_/api/pam/teams' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_teams'
  WHERE uid = 'post_/api/pam/teams' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'get_api_pam_teams_teamId'
  WHERE uid = 'get_/api/pam/teams/:teamId' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_teams_teamId_members'
  WHERE uid = 'post_/api/pam/teams/:teamId/members' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'patch_api_pam_teams_teamId_members_userId'
  WHERE uid = 'patch_/api/pam/teams/:teamId/members/:userId' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'delete_api_pam_teams_teamId_members_userId'
  WHERE uid = 'delete_/api/pam/teams/:teamId/members/:userId' AND (slug IS NULL OR slug = '');
UPDATE public.pam_role_permissions SET slug = 'post_api_pam_teams_teamId_projects'
  WHERE uid = 'post_/api/pam/teams/:teamId/projects' AND (slug IS NULL OR slug = '');

CREATE UNIQUE INDEX IF NOT EXISTS idx_pam_role_permissions_slug
  ON public.pam_role_permissions (slug)
  WHERE slug IS NOT NULL AND slug <> '';

COMMENT ON COLUMN public.pam_role_permissions.slug IS
  'Stable id for i18n key permission:{slug}; derived from uid.';
COMMENT ON COLUMN public.pam_role_permissions.description IS
  'Optional DB note for query/docs; UI uses permission:{slug} translations.';
