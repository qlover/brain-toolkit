-- ============================================================
-- Soft-deleted projects release their slug for reuse.
-- Active rows (is_deleted = 0) keep a global unique slug.
-- ============================================================

ALTER TABLE pam_projects DROP CONSTRAINT IF EXISTS pam_projects_slug_key;

DROP INDEX IF EXISTS idx_pam_projects_slug_active;

CREATE UNIQUE INDEX idx_pam_projects_slug_active
  ON pam_projects (slug)
  WHERE is_deleted = 0;

COMMENT ON INDEX idx_pam_projects_slug_active IS
  'Slug is unique among non-deleted projects; soft-delete frees the name.';
