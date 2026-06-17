-- ============================================================
-- 测试数据插入（基于原型示例，适配您的用户ID）
-- 用户ID: 66edd6c4-1f89-4481-a13d-20f29e9d733f
-- 邮箱: myused@sina.com
-- ============================================================

-- 注意：请确保用户已在 auth.users 中存在，否则外键约束会失败。
-- 若用户不存在，可先通过 Supabase 管理界面创建该用户，或暂时注释掉外键约束进行测试。

-- 插入公开项目 (is_public = 1)
INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
VALUES
    (gen_random_uuid(), 'backend-benchmark', 'Brain Backend', '核心后端API及性能基准', 'Go, Prometheus', 'https://github.com/brain/backend', '后端', 1, '66edd6c4-1f89-4481-a13d-20f29e9d733f'),
    (gen_random_uuid(), 'user-sdk', 'BrainUserSDK', '用户认证与OAuth SDK', 'TypeScript, React', 'https://gitlab.com/brain/user-sdk', '前端', 1, '66edd6c4-1f89-4481-a13d-20f29e9d733f');

-- 插入私有项目 (is_public = 0)
INSERT INTO pam_projects (id, slug, name, description, stack, repo_url, category, is_public, owner_id)
VALUES
    (gen_random_uuid(), 'admin-dashboard', 'Admin Dashboard', '内部运营管理面板', 'Vue3, Tailwind, Supabase', 'https://gitee.com/brain/admin', '前端', 0, '66edd6c4-1f89-4481-a13d-20f29e9d733f'),
    (gen_random_uuid(), 'chat-conductor', 'Chat Conductor', '实时聊天网关', 'Node.js, Socket.io', 'https://github.com/qlover/chat', '基础设施', 0, '66edd6c4-1f89-4481-a13d-20f29e9d733f');

-- 为上述项目插入环境及环境变量（JSONB）
-- 我们需要先查询插入的项目ID，建议用子查询或DO块。简化示例，我们使用固定的UUID（用gen_random_uuid()生成并保存变量）
-- 更可靠的方法：使用CTE（WITH）来获取插入的ID，但此处为了可读性，用DO块动态插入。

DO $$
DECLARE
    proj_id UUID;
BEGIN
    -- 1. Brain Backend (公开)
    SELECT id INTO proj_id FROM pam_projects WHERE slug = 'backend-benchmark' LIMIT 1;
    IF proj_id IS NOT NULL THEN
        INSERT INTO pam_environments (project_id, name, url, variables) VALUES
            (proj_id, 'dev', 'https://dev-backend.brain.ai', '{"LOG_LEVEL": "debug", "RATE_LIMIT": "1000"}'::jsonb),
            (proj_id, 'prod', 'https://backend.brain.ai', '{"LOG_LEVEL": "error", "RATE_LIMIT": "5000"}'::jsonb);
    END IF;

    -- 2. BrainUserSDK (公开)
    SELECT id INTO proj_id FROM pam_projects WHERE slug = 'user-sdk' LIMIT 1;
    IF proj_id IS NOT NULL THEN
        INSERT INTO pam_environments (project_id, name, url, variables) VALUES
            (proj_id, 'dev', 'https://dev-sdk.brain.ai', '{"API_VERSION": "v2-dev", "DEBUG": "true"}'::jsonb),
            (proj_id, 'prod', 'https://sdk.brain.ai', '{"API_VERSION": "v2", "DEBUG": "false"}'::jsonb);
    END IF;

    -- 3. Admin Dashboard (私有)
    SELECT id INTO proj_id FROM pam_projects WHERE slug = 'admin-dashboard' LIMIT 1;
    IF proj_id IS NOT NULL THEN
        INSERT INTO pam_environments (project_id, name, url, variables) VALUES
            (proj_id, 'dev', 'https://admin-dev.brain.ai', '{"SUPABASE_URL": "dev.supabase"}'::jsonb),
            (proj_id, 'prod', 'https://admin.brain.ai', '{"SUPABASE_URL": "prod.supabase"}'::jsonb);
    END IF;

    -- 4. Chat Conductor (私有)
    SELECT id INTO proj_id FROM pam_projects WHERE slug = 'chat-conductor' LIMIT 1;
    IF proj_id IS NOT NULL THEN
        INSERT INTO pam_environments (project_id, name, url, variables) VALUES
            (proj_id, 'dev', 'https://chat-dev.brain.ai', '{"REDIS_HOST": "redis-dev"}'::jsonb),
            (proj_id, 'prod', 'https://chat.brain.ai', '{"REDIS_HOST": "redis-prod"}'::jsonb);
    END IF;
END $$;

-- 可选：添加其他测试数据或不同拥有者的项目（如需测试协作/访客场景，可添加 bob 用户）
-- 但本测试仅使用指定用户，已涵盖公开/私有场景。