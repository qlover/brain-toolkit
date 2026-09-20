-- Existing DBs: Memory KV admin inspect (super-admin / role key `admin` only).
-- Keep in sync with apps/pam/shared/auth/permissionKeys.ts

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
