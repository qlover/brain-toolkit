-- =============================================================================
-- PAM user feedback + GitHub Issue sync
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.pam_user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category text NOT NULL,
  body text NOT NULL,
  page_url text,
  user_agent text,
  client_context jsonb,
  screenshot_paths text[],
  status text NOT NULL DEFAULT 'open',
  github_sync_status text NOT NULL DEFAULT 'pending',
  github_issue_number integer,
  github_issue_url text,
  github_sync_error text,
  github_synced_at timestamptz,
  github_screenshot_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pam_user_feedback_category_chk CHECK (
    category IN ('bug', 'ux', 'feature', 'performance', 'content', 'other')
  ),
  CONSTRAINT pam_user_feedback_status_chk CHECK (
    status IN ('open', 'reviewing', 'resolved', 'closed')
  ),
  CONSTRAINT pam_user_feedback_github_sync_chk CHECK (
    github_sync_status IN ('pending', 'synced', 'failed', 'skipped')
  )
);

CREATE INDEX IF NOT EXISTS idx_pam_user_feedback_user_id
  ON public.pam_user_feedback (user_id);

CREATE INDEX IF NOT EXISTS idx_pam_user_feedback_created_at
  ON public.pam_user_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pam_user_feedback_github_issue_number
  ON public.pam_user_feedback (github_issue_number)
  WHERE github_issue_number IS NOT NULL;

COMMENT ON TABLE public.pam_user_feedback IS
  'User feedback; synced to GitHub Issues via GitHub App.';

INSERT INTO public.pam_role_permissions (permission_key, type, method, path, description)
VALUES
  ('admin_feedback_read', 'api', 'get', '/api/admin/feedback', 'List user feedback'),
  ('admin_feedback_update', 'api', 'patch', '/api/admin/feedback', 'Update feedback status / create GitHub issue')
ON CONFLICT (permission_key) DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_feedback_read')
) AS v(permission_key) ON TRUE
WHERE r.key = 'operator'
ON CONFLICT DO NOTHING;

INSERT INTO public.pam_role_assignments (role_id, permission_key)
SELECT r.id, v.permission_key
FROM public.pam_roles r
JOIN (VALUES
  ('admin_feedback_read'),
  ('admin_feedback_update')
) AS v(permission_key) ON TRUE
WHERE r.key = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pam-user-feedback',
  'pam-user-feedback',
  false,
  1572864,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO public.pam_site_settings (key, value, description, is_sensitive)
VALUES
  (
    'github.feedback_sync_enabled',
    'false'::jsonb,
    '用户提交反馈后是否自动用 GitHub App 创建 Issue',
    false
  ),
  (
    'github.feedback_repo',
    '"qlover/brain-toolkit"'::jsonb,
    '反馈 Issue 目标仓库 owner/repo',
    false
  )
ON CONFLICT (key) DO NOTHING;
