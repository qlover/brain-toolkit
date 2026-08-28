ALTER TABLE pam_projects
  ADD COLUMN IF NOT EXISTS preview_image_url text;

COMMENT ON COLUMN pam_projects.preview_image_url IS
  'Optional public URL for project cover / first-screen preview image';

-- Lookup Auth user id by email (service_role / SECURITY DEFINER only).
-- supabase-js admin has no getUserByEmail; listUsers also omits GoTrue's filter.
CREATE OR REPLACE FUNCTION pam_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
STABLE
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION pam_auth_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pam_auth_user_id_by_email(text) TO service_role;

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
      INSERT INTO pam_environments (id, project_id, name, url, variables)
      VALUES (
        COALESCE(v_env_record.id, gen_random_uuid()),
        p_project_id,
        v_env_record.name,
        v_env_record.url,
        COALESCE(v_env_record.variables, '{}'::jsonb)
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        variables = EXCLUDED.variables,
        updated_at = now();
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
      (SELECT jsonb_agg(row_to_json(e)) FROM pam_environments e WHERE e.project_id = p_project_id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM pam_projects p
  WHERE p.id = p_project_id;

  RETURN v_result;
END;
$$;
