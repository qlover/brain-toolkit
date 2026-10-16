-- PAM: split environment variables out of pam_environments.variables JSONB
-- into pam_env_variables (one row per key).
--
-- Does NOT drop pam_environments.variables (legacy column kept for rollback /
-- inspection). Application code stops writing it after this migration.
--
-- Apply on existing databases after 001-pam-upgrade.sql.
-- Safe to re-run: CREATE IF NOT EXISTS, inserts skip when target already has rows.

-- ============================================================
-- 1. Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pam_env_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_id UUID NOT NULL REFERENCES public.pam_environments (id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  comments JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (environment_id, key)
);

COMMENT ON TABLE public.pam_env_variables IS
  'Per-key environment variables (replaces pam_environments.variables JSONB as source of truth).';

COMMENT ON COLUMN public.pam_environments.variables IS
  'Legacy JSONB blob. Prefer pam_env_variables. App stops writing after 002 migration.';

CREATE INDEX IF NOT EXISTS idx_pam_env_variables_environment_id
  ON public.pam_env_variables (environment_id);

DROP TRIGGER IF EXISTS trigger_pam_env_variables_updated_at ON public.pam_env_variables;
CREATE TRIGGER trigger_pam_env_variables_updated_at
BEFORE UPDATE ON public.pam_env_variables
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. RLS (same ownership model as pam_environments)
-- ============================================================
ALTER TABLE public.pam_env_variables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Select pam_env_variables" ON public.pam_env_variables;
CREATE POLICY "Select pam_env_variables" ON public.pam_env_variables
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.pam_environments e
    JOIN public.pam_projects p ON p.id = e.project_id
    WHERE e.id = pam_env_variables.environment_id
      AND (p.is_public = 1 OR p.owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Insert pam_env_variables" ON public.pam_env_variables;
CREATE POLICY "Insert pam_env_variables" ON public.pam_env_variables
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.pam_environments e
    JOIN public.pam_projects p ON p.id = e.project_id
    WHERE e.id = pam_env_variables.environment_id
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Update pam_env_variables" ON public.pam_env_variables;
CREATE POLICY "Update pam_env_variables" ON public.pam_env_variables
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.pam_environments e
    JOIN public.pam_projects p ON p.id = e.project_id
    WHERE e.id = pam_env_variables.environment_id
      AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.pam_environments e
    JOIN public.pam_projects p ON p.id = e.project_id
    WHERE e.id = pam_env_variables.environment_id
      AND p.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Delete pam_env_variables" ON public.pam_env_variables;
CREATE POLICY "Delete pam_env_variables" ON public.pam_env_variables
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.pam_environments e
    JOIN public.pam_projects p ON p.id = e.project_id
    WHERE e.id = pam_env_variables.environment_id
      AND p.owner_id = auth.uid()
  )
);

-- ============================================================
-- 3. Backfill from JSONB (array and legacy object shapes)
--    Skip environments that already have rows in pam_env_variables.
-- ============================================================
INSERT INTO public.pam_env_variables (
  id, environment_id, key, value, sensitive, comments, sort_order
)
SELECT
  COALESCE(
    NULLIF(elem->>'id', '')::uuid,
    gen_random_uuid()
  ),
  e.id,
  elem->>'key',
  COALESCE(elem->>'value', ''),
  COALESCE((elem->>'sensitive')::boolean, FALSE),
  CASE
    WHEN jsonb_typeof(elem->'comments') = 'array' THEN elem->'comments'
    WHEN jsonb_typeof(elem->'comment') = 'string' THEN jsonb_build_array(elem->>'comment')
    ELSE NULL
  END,
  (ord - 1)::int
FROM public.pam_environments e
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(e.variables) = 'array' THEN e.variables
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS t(elem, ord)
WHERE jsonb_typeof(e.variables) = 'array'
  AND COALESCE(elem->>'key', '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.pam_env_variables v WHERE v.environment_id = e.id
  )
ON CONFLICT (environment_id, key) DO NOTHING;

INSERT INTO public.pam_env_variables (
  id, environment_id, key, value, sensitive, comments, sort_order
)
SELECT
  gen_random_uuid(),
  e.id,
  kv.key,
  kv.value,
  FALSE,
  NULL,
  (row_number() OVER (PARTITION BY e.id ORDER BY kv.key) - 1)::int
FROM public.pam_environments e
CROSS JOIN LATERAL jsonb_each_text(
  CASE
    WHEN jsonb_typeof(e.variables) = 'object' THEN e.variables
    ELSE '{}'::jsonb
  END
) AS kv(key, value)
WHERE jsonb_typeof(e.variables) = 'object'
  AND kv.key <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.pam_env_variables v WHERE v.environment_id = e.id
  )
ON CONFLICT (environment_id, key) DO NOTHING;

-- ============================================================
-- 4. update_project_with_environments: write rows + assemble on read
-- ============================================================
CREATE OR REPLACE FUNCTION update_project_with_environments(
  p_project_id UUID,
  p_updates JSONB,
  p_environments JSONB DEFAULT NULL,
  p_remove_missing BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner_id UUID;
  v_env_record RECORD;
  v_env_id UUID;
  v_var RECORD;
  v_ord INT;
  v_result JSONB;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM pam_projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project % not found', p_project_id;
  END IF;

  IF v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Permission denied: not the owner';
  END IF;

  IF p_updates IS NOT NULL AND jsonb_typeof(p_updates) = 'object' AND p_updates <> '{}'::jsonb THEN
    IF p_updates ? 'owner_id' OR p_updates ? 'id' THEN
      RAISE EXCEPTION 'Cannot update id or owner_id';
    END IF;

    UPDATE pam_projects
    SET
      name = COALESCE((p_updates->>'name')::text, name),
      description = COALESCE((p_updates->>'description')::text, description),
      stack = COALESCE((p_updates->>'stack')::text, stack),
      repo_url = COALESCE((p_updates->>'repo_url')::text, repo_url),
      preview_image_url = COALESCE((p_updates->>'preview_image_url')::text, preview_image_url),
      category = COALESCE((p_updates->>'category')::text, category),
      is_public = COALESCE((p_updates->>'is_public')::int, is_public),
      updated_at = now()
    WHERE id = p_project_id;
  END IF;

  IF p_environments IS NOT NULL AND jsonb_typeof(p_environments) = 'array' THEN
    FOR v_env_record IN
      SELECT id, name, url, variables
      FROM jsonb_to_recordset(p_environments) AS x(id UUID, name TEXT, url TEXT, variables JSONB)
    LOOP
      v_env_id := COALESCE(v_env_record.id, gen_random_uuid());

      INSERT INTO pam_environments (id, project_id, name, url, variables)
      VALUES (
        v_env_id,
        p_project_id,
        v_env_record.name,
        v_env_record.url,
        COALESCE(v_env_record.variables, '[]'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        -- Keep legacy column in sync for rollback visibility; app reads pam_env_variables.
        variables = EXCLUDED.variables,
        updated_at = now();

      IF v_env_record.variables IS NOT NULL THEN
        DELETE FROM pam_env_variables WHERE environment_id = v_env_id;

        v_ord := 0;
        IF jsonb_typeof(v_env_record.variables) = 'array' THEN
          FOR v_var IN
            SELECT elem
            FROM jsonb_array_elements(v_env_record.variables) AS elem
          LOOP
            IF COALESCE(v_var.elem->>'key', '') = '' THEN
              CONTINUE;
            END IF;
            INSERT INTO pam_env_variables (
              id, environment_id, key, value, sensitive, comments, sort_order
            ) VALUES (
              COALESCE(NULLIF(v_var.elem->>'id', '')::uuid, gen_random_uuid()),
              v_env_id,
              v_var.elem->>'key',
              COALESCE(v_var.elem->>'value', ''),
              COALESCE((v_var.elem->>'sensitive')::boolean, FALSE),
              CASE
                WHEN jsonb_typeof(v_var.elem->'comments') = 'array' THEN v_var.elem->'comments'
                ELSE NULL
              END,
              v_ord
            )
            ON CONFLICT (environment_id, key) DO UPDATE SET
              id = EXCLUDED.id,
              value = EXCLUDED.value,
              sensitive = EXCLUDED.sensitive,
              comments = EXCLUDED.comments,
              sort_order = EXCLUDED.sort_order,
              updated_at = now();
            v_ord := v_ord + 1;
          END LOOP;
        END IF;
      END IF;
    END LOOP;
  END IF;

  IF p_remove_missing AND p_environments IS NOT NULL THEN
    DELETE FROM pam_environments
    WHERE project_id = p_project_id
    AND id NOT IN (
      SELECT id FROM jsonb_to_recordset(p_environments) AS x(id UUID) WHERE id IS NOT NULL
    );
  END IF;

  SELECT jsonb_build_object(
    'project', row_to_json(p),
    'environments', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'url', e.url,
            'is_protected', e.is_protected,
            'variables', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', v.id,
                    'key', v.key,
                    'value', v.value,
                    'sensitive', v.sensitive
                  )
                  || CASE
                    WHEN v.comments IS NOT NULL THEN jsonb_build_object('comments', v.comments)
                    ELSE '{}'::jsonb
                  END
                  ORDER BY v.sort_order, v.key
                )
                FROM pam_env_variables v
                WHERE v.environment_id = e.id
              ),
              '[]'::jsonb
            )
          )
          ORDER BY e.name
        )
        FROM pam_environments e
        WHERE e.project_id = p_project_id
      ),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM pam_projects p
  WHERE p.id = p_project_id;

  RETURN v_result;
END;
$$;
