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

-- -- ============================================================
-- -- 7. 插入测试数据
-- -- ============================================================
-- -- 用户 UUID
-- DO $$
-- DECLARE
--     user1 UUID := '66edd6c4-1f89-4481-a13d-20f29e9d733f';
--     user2 UUID := '308c658e-a3c8-4684-89d4-9c62111344f7';
--     proj_id UUID;
-- BEGIN
--     -- 确保两个用户在 auth.users 中存在，否则插入会失败（外键约束）
--     -- 若不存在，可先插入 dummy 用户（但 Supabase 管理界面会处理，通常已存在）

--     -- ---------- 用户1 的 5 个项目 ----------
--     -- 1. 公开项目：Brain Backend
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'backend-benchmark', 'Brain Backend', '核心后端API及性能基准', 'Go, Prometheus', 'https://github.com/brain/backend', '后端', 1, user1)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://dev-backend.brain.ai', '{"LOG_LEVEL": "debug", "RATE_LIMIT": "1000"}'::jsonb),
--         (proj_id, 'prod', 'https://backend.brain.ai', '{"LOG_LEVEL": "error", "RATE_LIMIT": "5000", "CORS": "true"}'::jsonb);

--     -- 2. 公开项目：User SDK
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'user-sdk', 'BrainUserSDK', '用户认证与OAuth SDK', 'TypeScript, React', 'https://gitlab.com/brain/user-sdk', '前端', 1, user1)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://dev-sdk.brain.ai', '{"API_VERSION": "v2-dev", "DEBUG": "true"}'::jsonb),
--         (proj_id, 'prod', 'https://sdk.brain.ai', '{"API_VERSION": "v2", "DEBUG": "false", "LOG_LEVEL": "info"}'::jsonb);

--     -- 3. 私有项目：Admin Dashboard
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'admin-dashboard', 'Admin Dashboard', '内部运营管理面板', 'Vue3, Tailwind, Supabase', 'https://gitee.com/brain/admin', '前端', 0, user1)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://admin-dev.brain.ai', '{"SUPABASE_URL": "dev.supabase", "SECRET": "dev-secret"}'::jsonb),
--         (proj_id, 'prod', 'https://admin.brain.ai', '{"SUPABASE_URL": "prod.supabase", "SECRET": "prod-secret"}'::jsonb),
--         (proj_id, 'staging', 'https://staging.brain.ai', '{"SUPABASE_URL": "staging.supabase", "SECRET": "staging-secret"}'::jsonb);

--     -- 4. 公开项目：Chat Conductor
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'chat-conductor', 'Chat Conductor', '实时聊天网关', 'Node.js, Socket.io', 'https://github.com/qlover/chat', '基础设施', 1, user1)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://chat-dev.brain.ai', '{"REDIS_HOST": "redis-dev", "PORT": "6379"}'::jsonb),
--         (proj_id, 'prod', 'https://chat.brain.ai', '{"REDIS_HOST": "redis-prod", "PORT": "6380", "CLUSTER": "true"}'::jsonb);

--     -- 5. 私有项目：ML Pipeline
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'ml-pipeline', 'ML Pipeline', '机器学习训练与部署流水线', 'Python, PyTorch, Kubeflow', 'https://github.com/brain/ml-pipeline', '机器学习', 0, user1)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://ml-dev.brain.ai', '{"MODEL": "bert", "BATCH_SIZE": "16"}'::jsonb),
--         (proj_id, 'prod', 'https://ml.brain.ai', '{"MODEL": "bert-large", "BATCH_SIZE": "64", "GPU": "A100"}'::jsonb);

--     -- ---------- 用户2 的 5 个项目 ----------
--     -- 6. 公开项目：Frontend Kit
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'frontend-kit', 'Frontend Kit', 'UI 组件库与设计系统', 'React, Storybook, Tailwind', 'https://github.com/design/frontend-kit', '前端', 1, user2)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://dev-kit.brain.ai', '{"THEME": "dark", "VERSION": "beta"}'::jsonb),
--         (proj_id, 'prod', 'https://kit.brain.ai', '{"THEME": "light", "VERSION": "stable"}'::jsonb);

--     -- 7. 私有项目：Database Migration
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'db-migration', 'Database Migration', '数据迁移与同步工具', 'Go, PostgreSQL, Flyway', 'https://gitlab.com/data/db-migration', '工具', 0, user2)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://db-dev.brain.ai', '{"DB_URL": "postgres://dev", "SSL": "false"}'::jsonb),
--         (proj_id, 'prod', 'https://db.brain.ai', '{"DB_URL": "postgres://prod", "SSL": "true", "BACKUP": "enabled"}'::jsonb);

--     -- 8. 公开项目：Analytics API
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'analytics-api', 'Analytics API', '实时数据分析接口', 'Node.js, Express, ClickHouse', 'https://github.com/analytics/api', '后端', 1, user2)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://api-dev.brain.ai', '{"CLICKHOUSE_HOST": "ch-dev", "CACHE": "redis"}'::jsonb),
--         (proj_id, 'prod', 'https://api.brain.ai', '{"CLICKHOUSE_HOST": "ch-prod", "CACHE": "memcached", "RATE_LIMIT": "1000"}'::jsonb);

--     -- 9. 私有项目：Internal Wiki
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'internal-wiki', 'Internal Wiki', '团队内部知识库', 'MkDocs, Markdown, Git', 'https://gitlab.com/wiki/internal-wiki', '文档', 0, user2)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://wiki-dev.brain.ai', '{"EDITOR": "typora", "SEARCH": "lunr"}'::jsonb),
--         (proj_id, 'prod', 'https://wiki.brain.ai', '{"EDITOR": "obsidian", "SEARCH": "algolia", "SSO": "enabled"}'::jsonb);

--     -- 10. 公开项目：Security Scanner
--     INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
--     VALUES (gen_random_uuid(), 'security-scanner', 'Security Scanner', '代码安全漏洞扫描器', 'Python, Bandit, Trivy', 'https://github.com/security/scanner', '工具', 1, user2)
--     RETURNING id INTO proj_id;
--     INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--         (proj_id, 'dev', 'https://scanner-dev.brain.ai', '{"SEVERITY": "high", "SCAN_INTERVAL": "24h"}'::jsonb),
--         (proj_id, 'prod', 'https://scanner.brain.ai', '{"SEVERITY": "critical", "SCAN_INTERVAL": "1h", "REPORT": "slack"}'::jsonb);

--     -- 额外：为 user2 的 Frontend Kit 增加一个 staging 环境（测试多环境）
--     -- 先找到该项目的 id
--     SELECT id INTO proj_id FROM pam_projects WHERE slug = 'frontend-kit' AND owner_id = user2;
--     IF proj_id IS NOT NULL THEN
--         INSERT INTO pam_environments (project_id, name, url, variables) VALUES
--             (proj_id, 'staging', 'https://staging-kit.brain.ai', '{"THEME": "system", "VERSION": "rc"}'::jsonb);
--     END IF;
-- END $$;