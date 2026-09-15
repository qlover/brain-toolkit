-- Admin roles console API permissions (additive / idempotent).

INSERT INTO public.pam_role_permissions (uid, slug, type, method, path, description) VALUES
  ('get_/api/admin/roles', 'get_api_admin_roles', 'api', 'get', '/api/admin/roles', 'List role permission catalog and assignments'),
  ('patch_/api/admin/roles', 'patch_api_admin_roles', 'api', 'patch', '/api/admin/roles', 'Replace role → permission assignments')
ON CONFLICT (uid) DO UPDATE SET
  slug = COALESCE(public.pam_role_permissions.slug, EXCLUDED.slug);

INSERT INTO public.pam_role_assignments (scope, role_key, permission_uid) VALUES
  ('system', 'operator', 'get_/api/admin/roles'),
  ('system', 'admin', 'get_/api/admin/roles'),
  ('system', 'admin', 'patch_/api/admin/roles')
ON CONFLICT DO NOTHING;
