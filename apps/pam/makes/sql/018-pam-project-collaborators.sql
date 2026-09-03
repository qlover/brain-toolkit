-- Project collaborators (per-project admin/member). Safe to re-run.
-- Access is enforced in PAMService; this table is service_role only (RLS on, no policies).

CREATE TABLE IF NOT EXISTS public.pam_project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.pam_projects (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active')),
  invited_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pam_project_collaborators_project_user_unique UNIQUE (project_id, user_id)
);

COMMENT ON TABLE public.pam_project_collaborators IS
  'Per-project collaborators; owner stays on pam_projects.owner_id.';
COMMENT ON COLUMN public.pam_project_collaborators.role IS
  'admin: manage collaborators + RW; member: RW / CLI only.';

CREATE INDEX IF NOT EXISTS idx_pam_project_collaborators_user
  ON public.pam_project_collaborators (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pam_project_collaborators_project
  ON public.pam_project_collaborators (project_id)
  WHERE status = 'active';

ALTER TABLE public.pam_project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.pam_project_collaborators_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_pam_project_collaborators_updated_at
  ON public.pam_project_collaborators;
CREATE TRIGGER trigger_pam_project_collaborators_updated_at
BEFORE UPDATE ON public.pam_project_collaborators
FOR EACH ROW EXECUTE FUNCTION public.pam_project_collaborators_set_updated_at();

-- Visibility: public OR owner OR active collaborator
CREATE OR REPLACE FUNCTION pam_search_projects(
  p_user_id uuid DEFAULT NULL,
  p_visibility text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10,
  p_include_count boolean DEFAULT TRUE,
  p_include_owner_id boolean DEFAULT TRUE,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc'
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
  v_sort_by text := coalesce(nullif(trim(coalesce(p_sort_by, '')), ''), 'created_at');
  v_sort_order text := lower(coalesce(nullif(trim(coalesce(p_sort_order, '')), ''), 'desc'));
BEGIN
  IF v_sort_by NOT IN ('created_at', 'updated_at') THEN
    v_sort_by := 'created_at';
  END IF;
  IF v_sort_order NOT IN ('asc', 'desc') THEN
    v_sort_order := 'desc';
  END IF;

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
        (p_visibility IS NULL AND (
          p.is_public = 1
          OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)
          OR (
            p_user_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_project_collaborators c
              WHERE c.project_id = p.id
                AND c.user_id = p_user_id
                AND c.status = 'active'
            )
          )
        ))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND (
          p.owner_id = p_user_id
          OR EXISTS (
            SELECT 1
            FROM pam_project_collaborators c
            WHERE c.project_id = p.id
              AND c.user_id = p_user_id
              AND c.status = 'active'
          )
        ))
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
        (p_visibility IS NULL AND (
          p.is_public = 1
          OR (p_user_id IS NOT NULL AND p.owner_id = p_user_id)
          OR (
            p_user_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM pam_project_collaborators c
              WHERE c.project_id = p.id
                AND c.user_id = p_user_id
                AND c.status = 'active'
            )
          )
        ))
        OR (p_visibility = 'public' AND p.is_public = 1)
        OR (p_visibility = 'private' AND p.is_public = 0 AND p_user_id IS NOT NULL AND (
          p.owner_id = p_user_id
          OR EXISTS (
            SELECT 1
            FROM pam_project_collaborators c
            WHERE c.project_id = p.id
              AND c.user_id = p_user_id
              AND c.status = 'active'
          )
        ))
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
    ORDER BY
      p.is_public DESC,
      CASE
        WHEN v_sort_order = 'asc' THEN
          CASE WHEN v_sort_by = 'updated_at' THEN p.updated_at ELSE p.created_at END
      END ASC NULLS LAST,
      CASE
        WHEN v_sort_order = 'desc' THEN
          CASE WHEN v_sort_by = 'updated_at' THEN p.updated_at ELSE p.created_at END
      END DESC NULLS LAST,
      CASE WHEN v_sort_order = 'asc' THEN p.id END ASC,
      CASE WHEN v_sort_order = 'desc' THEN p.id END DESC
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
REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_search_projects(uuid, text, text, text, int, int, boolean, boolean, text, text) TO service_role;
