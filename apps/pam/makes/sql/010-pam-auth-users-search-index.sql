-- Faster transfer-picker search query plan (function only).
-- Do NOT create indexes on auth.users here — that requires table ownership
-- (ERROR 42501: must be owner of table users). Safe to re-run.

-- Prefer prefix match then fall back to contains (same GRANT as 009).
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
  WITH q AS (
    SELECT nullif(trim(coalesce(p_query, '')), '') AS raw,
           lower(nullif(trim(coalesce(p_query, '')), '')) AS raw_lower
  )
  SELECT u.id, coalesce(u.email, '')::text AS email
  FROM auth.users u
  CROSS JOIN q
  WHERE (p_exclude_id IS NULL OR u.id <> p_exclude_id)
    AND (
      q.raw IS NULL
      OR lower(u.email) LIKE q.raw_lower || '%'
      OR u.email ILIKE
        '%' || replace(replace(q.raw, '\', '\\'), '%', '\%') || '%'
    )
  ORDER BY
    CASE
      WHEN q.raw IS NULL THEN 0
      WHEN lower(u.email) LIKE q.raw_lower || '%' THEN 0
      ELSE 1
    END,
    u.email ASC NULLS LAST
  LIMIT LEAST(GREATEST(coalesce(p_limit, 20), 1), 50)
  OFFSET GREATEST(coalesce(p_offset, 0), 0);
$$;

REVOKE ALL ON FUNCTION pam_auth_users_search(text, uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_auth_users_search(text, uuid, int, int) TO service_role;
