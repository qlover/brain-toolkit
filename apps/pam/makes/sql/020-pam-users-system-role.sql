-- Additive only: add system_role. Do NOT drop or alter is_platform_admin.
-- After merge to master is stable, drop is_platform_admin in a separate cleanup migration.

ALTER TABLE public.pam_users
  ADD COLUMN IF NOT EXISTS system_role TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pam_users_system_role_check'
  ) THEN
    ALTER TABLE public.pam_users
      ADD CONSTRAINT pam_users_system_role_check
      CHECK (system_role IN ('user', 'operator', 'admin'));
  END IF;
END $$;

-- Copy legacy flag into the new column (pam_users.is_platform_admin unchanged).
UPDATE public.pam_users
SET system_role = 'admin'
WHERE is_platform_admin = TRUE
  AND system_role <> 'admin';

CREATE INDEX IF NOT EXISTS idx_pam_users_system_role_admin
  ON public.pam_users (system_role)
  WHERE system_role = 'admin';

COMMENT ON COLUMN public.pam_users.system_role IS
  'Platform system role: user | operator | admin. New RBAC source; is_platform_admin kept until post-merge cleanup.';
