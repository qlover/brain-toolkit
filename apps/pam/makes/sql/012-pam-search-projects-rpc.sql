-- Project list search: pg_trgm for keyword ILIKE + single RPC (projects + envs).
-- Safe to re-run. Requires service_role GRANT (same as other pam_* RPCs).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_pam_projects_search_trgm
  ON pam_projects USING gin (
    (
      coalesce(name, '') || ' ' ||
      coalesce(slug, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(stack, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(repo_url, '')
    ) gin_trgm_ops
  )
  WHERE is_deleted = 0;

CREATE OR REPLACE FUNCTION pam_search_projects(
  p_user_id uuid DEFAULT NULL,
  p_visibility text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10,
  p_include_count boolean DEFAULT TRUE,
  p_include_owner_id boolean DEFAULT TRUE
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page int := GREATEST(coalesce(p_page, 1), 1);
  v_page_size int := LEAST(GREATEST(coalesce(p_page_size, 10), 1), 100);
  v_offset int;
  v_keyword text;
  v_keyword_escaped text;
  v_total int := 0;
  v_loaded int := 0;
  v_has_more boolean := false;
  v_items jsonb := '[]'::jsonb;
BEGIN
  v_offset := (v_page - 1) * v_page_size;
  v_keyword := nullif(trim(coalesce(p_keyword, '')), '');

  IF p_visibility = 'private' AND p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'page', v_page,
      'pageSize', v_page_size,
      'total', 0,
      'hasMore', false,
      'items', '[]'::jsonb
    );
  END IF;

  IF v_keyword IS NOT NULL THEN
    v_keyword_escaped := replace(replace(replace(v_keyword, '\', '\\'), '%', '\%'), '_', '\_');
  END IF;

  IF p_include_count THEN
    SELECT count(*)::int INTO v_total
    FROM pam_projects p
    WHERE p.is_deleted = 0
      AND (p_category IS NULL OR btrim(p_category) = '' OR p.category = p_category)
      AND (
        (p_visibility IS NULL AND (p.is_public = 1 OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND p.owner_id = p_user_id)
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
      );
  END IF;

  WITH paged AS (
    SELECT p.*
    FROM pam_projects p
    WHERE p.is_deleted = 0
      AND (p_category IS NULL OR btrim(p_category) = '' OR p.category = p_category)
      AND (
        (p_visibility IS NULL AND (p.is_public = 1 OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND p.owner_id = p_user_id)
      )
      AND (
        v_keyword IS NULL
        OR p.name ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR p.slug ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.description, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.stack, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.category, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
        OR coalesce(p.repo_url, '') ILIKE '%' || v_keyword_escaped || '%' ESCAPE '\'
      )
    ORDER BY p.is_public DESC, p.created_at DESC, p.id DESC
    LIMIT v_page_size
    OFFSET v_offset
  )
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', row.id,
        'slug', row.slug,
        'name', row.name,
        'category', row.category,
        'description', row.description,
        'stack', row.stack,
        'repo_url', row.repo_url,
        'preview_image_url', row.preview_image_url,
        'is_public', row.is_public,
        'create_source', row.create_source,
        'created_at', row.created_at,
        'updated_at', row.updated_at
      )
      || CASE
        WHEN p_include_owner_id THEN jsonb_build_object('owner_id', row.owner_id)
        ELSE '{}'::jsonb
      END
      || jsonb_build_object(
        'environments', coalesce(row.envs, '[]'::jsonb)
      )
    ),
    '[]'::jsonb
  )
  INTO v_items
  FROM (
    SELECT
      p.*,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'url', e.url
          )
          ORDER BY e.name
        )
        FROM pam_environments e
        WHERE e.project_id = p.id
      ) AS envs
    FROM paged p
  ) AS row;

  v_loaded := coalesce(jsonb_array_length(v_items), 0);

  IF v_loaded < v_page_size THEN
    v_has_more := false;
  ELSIF p_include_count AND v_total > 0 THEN
    v_has_more := (v_offset + v_loaded) < v_total;
  ELSE
    v_has_more := v_loaded >= v_page_size;
  END IF;

  IF NOT p_include_count AND v_total = 0 AND v_loaded > 0 THEN
    v_total := v_offset + v_loaded;
  END IF;

  RETURN jsonb_build_object(
    'page', v_page,
    'pageSize', v_page_size,
    'total', v_total,
    'hasMore', v_has_more,
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean) TO service_role;
