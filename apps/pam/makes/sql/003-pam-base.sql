-- ============================================================
-- 1. 启用扩展（可选，用于模糊搜索）
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- 2. 项目表 (pam_projects)
-- ============================================================
CREATE TABLE pam_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    stack TEXT,
    repo_url TEXT,
    category TEXT,
    is_public INT NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),   -- 0=私有, 1=公开
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pam_projects_owner_id ON pam_projects(owner_id);
CREATE INDEX idx_pam_projects_is_public ON pam_projects(is_public);
CREATE INDEX idx_pam_projects_category ON pam_projects(category);
CREATE INDEX idx_pam_projects_slug ON pam_projects(slug);
CREATE INDEX idx_pam_projects_name_trgm ON pam_projects USING GIN (name gin_trgm_ops);
CREATE INDEX idx_pam_projects_description_trgm ON pam_projects USING GIN (description gin_trgm_ops);

-- 自动更新 updated_at
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

-- ============================================================
-- 3. 环境表 (pam_environments) - 使用 JSONB 存储变量
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

CREATE INDEX idx_pam_environments_project_id ON pam_environments(project_id);
CREATE INDEX idx_pam_environments_variables ON pam_environments USING GIN (variables);

CREATE TRIGGER trigger_pam_environments_updated_at
BEFORE UPDATE ON pam_environments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. 启用行级安全策略 (RLS)
-- ============================================================
ALTER TABLE pam_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pam_environments ENABLE ROW LEVEL SECURITY;

-- ----------------------
-- pam_projects 策略
-- ----------------------

-- 读策略：公开项目（is_public=1）所有人可读，私有项目仅所有者可读
CREATE POLICY "Select pam_projects" ON pam_projects
FOR SELECT
USING (
    is_public = 1
    OR
    owner_id = auth.uid()
);

-- 插入策略：仅认证用户可创建，且 owner_id 必须等于自己的 ID
CREATE POLICY "Insert pam_projects" ON pam_projects
FOR INSERT
WITH CHECK ( auth.uid() = owner_id );

-- 更新策略：仅所有者可更新
CREATE POLICY "Update pam_projects" ON pam_projects
FOR UPDATE
USING ( auth.uid() = owner_id )
WITH CHECK ( auth.uid() = owner_id );

-- 删除策略：仅所有者可删除
CREATE POLICY "Delete pam_projects" ON pam_projects
FOR DELETE
USING ( auth.uid() = owner_id );

-- ----------------------
-- pam_environments 策略
-- ----------------------

-- 读策略：环境权限跟随项目（公开项目可读，私有仅所有者）
CREATE POLICY "Select pam_environments" ON pam_environments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND (
            pam_projects.is_public = 1
            OR
            pam_projects.owner_id = auth.uid()
        )
    )
);

-- 插入策略：仅项目所有者可新增环境
CREATE POLICY "Insert pam_environments" ON pam_environments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);

-- 更新策略：仅项目所有者可更新环境
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

-- 删除策略：仅项目所有者可删除环境
CREATE POLICY "Delete pam_environments" ON pam_environments
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM pam_projects
        WHERE pam_projects.id = pam_environments.project_id
        AND pam_projects.owner_id = auth.uid()
    )
);

-- ============================================================
-- 5. 示例数据（请将下方 UUID 替换为 auth.users 中真实存在的用户 ID）
-- ============================================================
/*
INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
VALUES
    (gen_random_uuid(), 'backend-benchmark', 'Brain Backend', '核心后端API及性能基准', 'Go, Prometheus', 'https://github.com/brain/backend', '后端', 1, 'alice-uuid'),
    (gen_random_uuid(), 'user-sdk', 'BrainUserSDK', '用户认证与OAuth SDK', 'TypeScript, React', 'https://gitlab.com/brain/user-sdk', '前端', 1, 'alice-uuid'),
    (gen_random_uuid(), 'admin-dashboard', 'Admin Dashboard', '内部运营管理面板', 'Vue3, Tailwind, Supabase', 'https://gitee.com/brain/admin', '前端', 0, 'alice-uuid'),
    (gen_random_uuid(), 'chat-conductor', 'Chat Conductor', '实时聊天网关', 'Node.js, Socket.io', 'https://github.com/qlover/chat', '基础设施', 1, 'bob-uuid');

INSERT INTO pam_environments (project_id, name, url, variables)
VALUES 
    ('<project1-id>', 'dev', 'https://dev-backend.brain.ai', '{"LOG_LEVEL": "debug", "RATE_LIMIT": "1000"}'::jsonb),
    ('<project1-id>', 'prod', 'https://backend.brain.ai', '{"LOG_LEVEL": "error", "RATE_LIMIT": "5000"}'::jsonb);
*/

-- ============================================================
-- 6. 添加全文搜索支持 (tsvector + GIN 索引)
-- ============================================================

-- 6.1 为 pam_projects 添加生成的 tsvector 列，组合多个字段，并设置权重
ALTER TABLE pam_projects
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(stack, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'D')
) STORED;

-- 6.2 在该列上创建 GIN 索引，加速全文搜索查询
CREATE INDEX idx_pam_projects_search_vector
ON pam_projects USING GIN (search_vector);
