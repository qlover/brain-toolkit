-- ============================================================
-- pam_projects.create_source: how the project was created
-- 0 = web/browser, 1 = CLI (pamenv), 2 = fork
-- ============================================================
ALTER TABLE pam_projects
  ADD COLUMN IF NOT EXISTS create_source INT NOT NULL DEFAULT 0
  CHECK (create_source IN (0, 1, 2));

COMMENT ON COLUMN pam_projects.create_source IS
  '0=web, 1=cli, 2=fork';
