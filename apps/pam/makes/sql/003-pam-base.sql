-- ============================================================
-- 1. 删除旧表（谨慎！）
-- ============================================================
DROP TABLE IF EXISTS pam_environments CASCADE;
DROP TABLE IF EXISTS pam_projects CASCADE;

-- ============================================================
-- 2. 创建项目表
-- ============================================================
CREATE TABLE pam_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    stack TEXT,
    repo_url TEXT,
    category TEXT,
    is_public INT NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
    is_deleted INT NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. 创建环境表
-- ============================================================
CREATE TABLE pam_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pam_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT,
    variables JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

-- ============================================================
-- 4. 索引
-- ============================================================
CREATE INDEX idx_pam_projects_owner_id ON pam_projects(owner_id);
CREATE INDEX idx_pam_projects_visibility ON pam_projects(is_public);
CREATE INDEX idx_pam_projects_category ON pam_projects(category);
CREATE INDEX idx_pam_projects_slug ON pam_projects(slug);
CREATE INDEX idx_pam_environments_project_id ON pam_environments(project_id);

-- ============================================================
-- 5. 自动更新时间戳函数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pam_projects_updated_at
BEFORE UPDATE ON pam_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pam_environments_updated_at
BEFORE UPDATE ON pam_environments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. 启用 RLS
-- ============================================================
ALTER TABLE pam_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pam_environments ENABLE ROW LEVEL SECURITY;

-- 为了测试方便，先创建宽松的 RLS（可后续调整）
CREATE POLICY "Select pam_projects" ON pam_projects
FOR SELECT
USING (is_public = 1 OR owner_id = auth.uid());

CREATE POLICY "Insert pam_projects" ON pam_projects
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Update pam_projects" ON pam_projects
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Delete pam_projects" ON pam_projects
FOR DELETE
USING (auth.uid() = owner_id);

-- 环境策略
CREATE POLICY "Select pam_environments" ON pam_environments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND (pam_projects.is_public = 1 OR pam_projects.owner_id = auth.uid())
    )
);

CREATE POLICY "Insert pam_environments" ON pam_environments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);

CREATE POLICY "Update pam_environments" ON pam_environments
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);

CREATE POLICY "Delete pam_environments" ON pam_environments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);
