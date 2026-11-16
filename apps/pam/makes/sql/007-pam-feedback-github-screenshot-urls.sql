-- =============================================================================
-- Persist GitHub raw screenshot URLs after Issue comment; allow purging local Storage
-- Safe to re-run
-- =============================================================================

ALTER TABLE public.pam_user_feedback
  ADD COLUMN IF NOT EXISTS github_screenshot_urls text[];

COMMENT ON COLUMN public.pam_user_feedback.github_screenshot_urls IS
  'GitHub feedback-assets raw URLs after screenshots were posted to the Issue; local Storage may be purged.';
