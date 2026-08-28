-- User search for project transfer picker (service_role / SECURITY DEFINER).
CREATE OR REPLACE FUNCTION pam_auth_users_search(
  p_query text DEFAULT '',
  p_exclude_id uuid DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
  SELECT u.id, coalesce(u.email, '')::text AS email
  FROM auth.users u
  WHERE (p_exclude_id IS NULL OR u.id <> p_exclude_id)
    AND (
      nullif(trim(coalesce(p_query, '')), '') IS NULL
      OR u.email ILIKE
        '%' || replace(replace(trim(p_query), '\', '\\'), '%', '\%') || '%'
    )
  ORDER BY u.email ASC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(p_limit, 20), 1), 50)
  OFFSET GREATEST(coalesce(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION pam_auth_users_search(text, uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_auth_users_search(text, uuid, int, int) TO service_role;

-- Public cover images for PAM projects (capture once, refresh on demand).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pam-previews',
  'pam-previews',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read pam-previews" ON storage.objects;
CREATE POLICY "Public read pam-previews"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pam-previews');
