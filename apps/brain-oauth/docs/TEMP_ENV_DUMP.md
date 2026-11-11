# 临时：运行时 env dump（用完删除）

分支用途：从**正在跑的** brain-oauth 进程按白名单导出明文变量，便于导入 PAM。

## 启用（Production / Preview）

1. Vercel 增加：
   - `ENV_DUMP_ENABLED=1`
   - `ENV_DUMP_TOKEN=<openssl rand -hex 32>`
2. 部署本分支。
3. 以 Brain admin 登录 → **管理后台 / 站点设置** → 「临时：导出系统环境变量」。
4. 填入与 `ENV_DUMP_TOKEN` 相同的 token → 导出 → 复制 dotenv → 导入 PAM。
5. **立刻**：关掉两个变量、删掉本功能代码并重新部署。

## API

`GET /api/admin/env-dump`  
头：`x-env-dump-token`  
须 Brain admin 会话 + 开关开启。

白名单见 `shared/config/EnvDumpConfig.ts`。
