-- Role permission catalog + role → permission grants (additive).
-- Naming: all role RBAC tables use pam_role_* prefix.
-- uid format: {lowercaseMethod}_{pathTemplate}
-- If an older draft used pam_permissions / pam_role_permissions, replace them.

DROP TABLE IF EXISTS public.pam_role_assignments;
DROP TABLE IF EXISTS public.pam_role_permissions;
DROP TABLE IF EXISTS public.pam_permissions;

-- Permission catalog (immutable uid is the identifier / PK)
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

-- Which role_key gets which permission uid
CREATE TABLE public.pam_role_assignments (
  scope TEXT NOT NULL CHECK (scope IN ('system', 'org')),
  role_key TEXT NOT NULL,
  permission_uid TEXT NOT NULL REFERENCES public.pam_role_permissions (uid) ON DELETE CASCADE,
  PRIMARY KEY (scope, role_key, permission_uid)
);

CREATE INDEX idx_pam_role_assignments_lookup
  ON public.pam_role_assignments (scope, role_key);

COMMENT ON TABLE public.pam_role_permissions IS
  'Permission catalog; uid is auth PK; slug is i18n id (permission:{slug}).';
COMMENT ON TABLE public.pam_role_assignments IS
  'Maps system|org role_key → permission uid.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_pam_role_permissions_slug
  ON public.pam_role_permissions (slug)
  WHERE slug IS NOT NULL AND slug <> '';

INSERT INTO public.pam_role_permissions (uid, slug, type, method, path, description) VALUES
  ('get_/api/admin/users', 'get_api_admin_users', 'api', 'get', '/api/admin/users', 'List platform users'),
  ('patch_/api/admin/users/:userId/platform-admin', 'patch_api_admin_users_userId_platform_admin', 'api', 'patch', '/api/admin/users/:userId/platform-admin', 'Set platform admin / system role'),
  ('patch_/api/admin/users/:userId/system-role', 'patch_api_admin_users_userId_system_role', 'api', 'patch', '/api/admin/users/:userId/system-role', 'Set system role user|operator|admin'),
  ('get_/api/admin/roles', 'get_api_admin_roles', 'api', 'get', '/api/admin/roles', 'List role permission catalog and assignments'),
  ('patch_/api/admin/roles', 'patch_api_admin_roles', 'api', 'patch', '/api/admin/roles', 'Replace role → permission assignments'),
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
  ('post_/api/pam/preview-image/:id', 'post_api_pam_preview_image_id', 'api', 'post', '/api/pam/preview-image/:id', 'Refresh project preview image');

INSERT INTO public.pam_role_assignments (scope, role_key, permission_uid) VALUES
  ('system', 'operator', 'get_/api/admin/users'),
  ('system', 'operator', 'get_/api/admin/roles'),
  ('system', 'operator', 'get_/api/admin/request-logs'),
  ('system', 'operator', 'get_/api/admin/phone-otps'),
  ('system', 'operator', 'get_/api/admin/site-settings'),
  ('system', 'admin', 'get_/api/admin/users'),
  ('system', 'admin', 'patch_/api/admin/users/:userId/platform-admin'),
  ('system', 'admin', 'patch_/api/admin/users/:userId/system-role'),
  ('system', 'admin', 'get_/api/admin/roles'),
  ('system', 'admin', 'patch_/api/admin/roles'),
  ('system', 'admin', 'get_/api/admin/request-logs'),
  ('system', 'admin', 'get_/api/admin/phone-otps'),
  ('system', 'admin', 'get_/api/admin/site-settings'),
  ('system', 'admin', 'patch_/api/admin/site-settings');

INSERT INTO public.pam_role_assignments (scope, role_key, permission_uid) VALUES
  ('org', 'member', 'get_/api/pam/:projectId/collaborators'),
  ('org', 'member', 'post_/api/pam/:projectId/environments'),
  ('org', 'member', 'post_/api/pam/:projectId/environments/:envId/variables'),
  ('org', 'member', 'get_/api/pam/:projectId/environments/:envId/export'),
  ('org', 'member', 'post_/api/pam/edit/:id'),
  ('org', 'member', 'post_/api/pam/preview-image/:id'),
  ('org', 'admin', 'get_/api/pam/:projectId/collaborators'),
  ('org', 'admin', 'post_/api/pam/:projectId/collaborators'),
  ('org', 'admin', 'patch_/api/pam/:projectId/collaborators/:userId'),
  ('org', 'admin', 'delete_/api/pam/:projectId/collaborators/:userId'),
  ('org', 'admin', 'post_/api/pam/:projectId/environments'),
  ('org', 'admin', 'post_/api/pam/:projectId/environments/:envId/delete'),
  ('org', 'admin', 'post_/api/pam/:projectId/environments/:envId/variables'),
  ('org', 'admin', 'get_/api/pam/:projectId/environments/:envId/export'),
  ('org', 'admin', 'post_/api/pam/delete/:id'),
  ('org', 'admin', 'post_/api/pam/edit/:id'),
  ('org', 'admin', 'post_/api/pam/transfer/:id'),
  ('org', 'admin', 'post_/api/pam/preview-image/:id'),
  ('org', 'owner', 'get_/api/pam/:projectId/collaborators'),
  ('org', 'owner', 'post_/api/pam/:projectId/collaborators'),
  ('org', 'owner', 'patch_/api/pam/:projectId/collaborators/:userId'),
  ('org', 'owner', 'delete_/api/pam/:projectId/collaborators/:userId'),
  ('org', 'owner', 'post_/api/pam/:projectId/environments'),
  ('org', 'owner', 'post_/api/pam/:projectId/environments/:envId/delete'),
  ('org', 'owner', 'post_/api/pam/:projectId/environments/:envId/variables'),
  ('org', 'owner', 'get_/api/pam/:projectId/environments/:envId/export'),
  ('org', 'owner', 'post_/api/pam/delete/:id'),
  ('org', 'owner', 'post_/api/pam/edit/:id'),
  ('org', 'owner', 'post_/api/pam/transfer/:id'),
  ('org', 'owner', 'post_/api/pam/preview-image/:id');
