-- List/search indexes for pam_projects (public / private filters + sort).
-- Safe to re-run: IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_pam_projects_list_public_active
  ON pam_projects (created_at DESC, id DESC)
  WHERE is_deleted = 0 AND is_public = 1;

CREATE INDEX IF NOT EXISTS idx_pam_projects_list_private_active
  ON pam_projects (owner_id, created_at DESC, id DESC)
  WHERE is_deleted = 0 AND is_public = 0;

CREATE INDEX IF NOT EXISTS idx_pam_projects_list_active_created
  ON pam_projects (is_public DESC, created_at DESC, id DESC)
  WHERE is_deleted = 0;
