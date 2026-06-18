-- 该函数用于更新 项目和环境的事务方法
-- 因为 supabase sdk api 不直接支持事务, 使用 rpc 调用该方法来支持事务
-- 假设函数名为 pam_update_project_with_envs
CREATE OR REPLACE FUNCTION update_project_with_environments(
  p_project_id UUID,
  p_updates JSONB,
  p_environments JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id UUID;
  v_env_record RECORD;
  v_result JSONB;
BEGIN
  -- 1. 更新项目字段（如果 p_updates 不为空）
  IF p_updates IS NOT NULL AND jsonb_typeof(p_updates) = 'object' AND jsonb_length(p_updates) > 0 THEN
    EXECUTE format('
      UPDATE pam_projects
      SET (%s) = ROW(%s)
      WHERE id = $1
    ', 
      (SELECT string_agg(key, ',') FROM jsonb_object_keys(p_updates) AS key),
      (SELECT string_agg('(' || quote_ident(key) || '::' || 
        CASE 
          WHEN jsonb_typeof(p_updates->key) = 'string' THEN 'text'
          WHEN jsonb_typeof(p_updates->key) = 'number' THEN 'numeric'
          WHEN jsonb_typeof(p_updates->key) = 'boolean' THEN 'boolean'
          ELSE 'jsonb'
        END || ')', ',') 
      FROM jsonb_object_keys(p_updates) AS key)
    ) USING p_project_id;
  END IF;

  -- 2. 处理环境（如果提供了）
  IF p_environments IS NOT NULL AND jsonb_typeof(p_environments) = 'array' THEN
    -- 遍历每个环境，执行 INSERT ... ON CONFLICT UPDATE
    FOR v_env_record IN SELECT * FROM jsonb_to_recordset(p_environments) AS x(
      id UUID,
      name TEXT,
      url TEXT,
      variables JSONB
    )
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

  -- 3. 返回完整的项目和环境
  SELECT jsonb_build_object(
    'project', row_to_json(p.*),
    'environments', (
      SELECT COALESCE(jsonb_agg(row_to_json(e)), '[]'::jsonb)
      FROM pam_environments e
      WHERE e.project_id = p_project_id
    )
  )
  INTO v_result
  FROM pam_projects p
  WHERE p.id = p_project_id;

  RETURN v_result;
END;
$$;