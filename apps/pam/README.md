# PAM（`apps/pam`）

> English: [README.en.md](./README.en.md)

PAM 是面向开发团队的多环境配置与环境变量管理平台：按项目、按环境维护变量，敏感值加密存储，用 [`pamenv`](../../packages/pamenv/README.md) CLI 在本地仓库与 PAM 之间同步。PAM 同时是一个标准的 OAuth 2.0 授权服务，其他应用可以接入统一登录。

**TL;DR**：`pnpm install` → 复制 `.env.template` 为 `.env` 并填写 → 在 Supabase 执行 `makes/sql/000-pam-full-schema.sql` → `pnpm dev`（`http://pam.localhost:3400`）→ 用平台管理员登录后在「管理后台 → 站点设置」补齐登录、邮件、短信等配置。

---

## 功能

| 模块               | 说明                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **项目与环境**     | 按项目管理 local / staging / production 等环境；变量按环境隔离，敏感值用 `PAM_ENV_SECRET_KEY` 加密；支持公开 / 私有、Fork、转让、导出 dotenv |
| **团队与权限**     | 团队成员（admin / member）、项目协作者；平台角色 → 权限点（`pam_role_permissions`）控制 API 访问                                             |
| **pamenv CLI**     | 浏览器设备码登录（`/pamenv/device`），`pull` / `push` 同步环境变量；CLI 使用说明见站内 `/docs/cli`（直接渲染 pamenv README）                 |
| **账号登录**       | 邮箱密码、注册、找回 / 重置密码、邮箱 OTP / Magic Link、手机验证码、GitHub / Google（Supabase Auth）、Brain OAuth（授权码 + PKCE）           |
| **OAuth 授权服务** | 基于 `@qlover/oauth-wrapper`：开发者控制台注册客户端、授权同意页、换票、userinfo、撤销、站内 Playground；接入说明见站内 `/docs/oauth`        |
| **管理后台**       | 用户、角色、权限、站点设置、多语言文案、请求日志、邮件日志、验证码监控、Memory KV（仅平台管理员）                                            |

---

## 技术栈

| 类别       | 技术                                                                 |
| ---------- | -------------------------------------------------------------------- |
| 框架       | Next.js 16（App Router + Pages Router）、React 19                    |
| 数据与鉴权 | Supabase（Postgres、Auth、Storage）                                  |
| OAuth      | `@qlover/oauth-wrapper`、`server/providers/SupabaseOAuthProvider.ts` |
| 公共能力   | `@brain-toolkit/next-app-kit`（站点设置、CORS、请求日志、KV 缓存等） |
| UI         | Ant Design 5、Tailwind CSS 4                                         |
| 国际化     | next-intl + ts2locales（见 [docs/i18n.md](./docs/i18n.md)）          |
| 依赖注入   | Inversify（`server/serverIoc.ts`）                                   |
| 校验       | Zod                                                                  |
| 质量       | TypeScript、ESLint、Prettier、Vitest                                 |

运行环境：Node.js `^20.17.0` 或 `>=22.9.0`（见 `package.json` 的 `engines`）。

---

## 快速开始

### 1. 环境变量

复制 `.env.template` 为 `.env`（或 `.env.local`），每项都有注释。最少需要：

| 变量                                 | 说明                                               |
| ------------------------------------ | -------------------------------------------------- |
| `SITE_URL`                           | 站点根地址，本地如 `http://pam.localhost:3400`     |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase 项目地址与 anon key                       |
| `SUPABASE_SERVICE_ROLE_KEY`          | 仅服务端使用；表启用 RLS 时需要                    |
| `JWT_SECRET` / `SESSION_SECRET`      | 登录 JWT 与 HttpOnly 会话签名密钥                  |
| `ENCRYPTION_KEY`                     | 加密数据库中的第三方 refresh token                 |
| `PAM_ENV_SECRET_KEY`                 | 加密敏感环境变量值（建议与 `ENCRYPTION_KEY` 分开） |

已经能访问 PAM 时，也可以用 `pnpm env:pull` / `pnpm env:push`（即 `pamenv pull/push pam -e local`）同步本地配置。

### 2. 数据库

| 场景           | 脚本                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| 全新安装       | `makes/sql/000-pam-full-schema.sql`（会 drop 后重建表，**勿在已有数据的库上执行**） |
| 已有数据库升级 | `makes/sql/001-pam-upgrade.sql`（可重复执行，不丢数据）                             |

在 Supabase SQL Editor 中执行。表统一以 `pam_` 为前缀。

### 3. 启动

```bash
pnpm dev            # http://pam.localhost:3400（APP_ENV=localhost）
pnpm dev:localhost  # http://localhost:3400
pnpm build && pnpm start   # 生产构建，端口 3401
```

`next.config.ts` 启动时会自动生成 `shared/config/apiRoutes.ts`、多语言 JSON 与主题 CSS，无需手动执行。

### 4. 站点设置

除上面的基础密钥外，运行期配置都存在数据库（`pam_site_settings`），由平台管理员在 **管理后台 → 站点设置**（`/admin/settings`）修改：

| 分组        | 内容                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------- |
| 登录与认证  | 手机验证码（memory / aliyun）、Google、Brain PKCE、Brain Supabase SSO 开关；CLI Token 有效期 |
| Brain OAuth | PAM 作为客户端对接 brain-oauth 的站点地址、client_id / secret、回调地址、scope、授权页语言   |
| 邮件        | 发送通道（disabled / memory / resend）、Resend API Key、发件人、找回密码 / 改密通知开关      |
| 阿里云短信  | AccessKey、签名、模板                                                                        |
| API 与 CORS | OAuth 机器端点的 CORS 规则（origin × path × methods）                                        |
| 其他        | OpenAI 兼容接口、预览图存储                                                                  |

`memory` 通道不真实发送：短信验证码在「验证码监控」、邮件在「邮件日志」中查看，适合本地开发。

---

## Brain OAuth 登录

PAM 作为 OAuth 客户端接入 [brain-oauth](../brain-oauth)，走授权码 + PKCE：

1. 在 brain-oauth 开发者控制台注册客户端，`redirect_uri` 填 `{SITE_URL}/api/callback/brain-oauth`。
2. 在 PAM **站点设置 → Brain OAuth** 填写站点地址、client_id；**机密客户端必须填 client_secret**，公共客户端可留空。
3. 在 **站点设置 → 登录与认证** 打开「Brain PKCE 登录」，登录页即出现「使用 Brain(PKCE) 登录」。

登录流程：`/api/user/login/brain` 跳转 Brain 授权页 → `/api/callback/brain-oauth` 换票 → 调 brain-oauth userinfo 取 `sub`、`email`、`name`、`phone_number` → 按 Brain 身份关联或创建 PAM 账号 → 撤销本次的 refresh token（PAM 只用一次 access token）。

- 新账号写入 Brain 的显示名与手机号；已有账号只补空缺字段，手机号已被其他账号占用时跳过。
- Brain 账号没有邮箱（如仅手机号注册）时，`auth.users` 使用 `@brain.oauth` 占位邮箱，但不会写入 PAM 资料。
- brain-oauth 的多环境对 PAM 透明，PAM 只认 userinfo 返回的 `sub`。

---

## PAM 作为 OAuth 授权服务

第三方应用接入 PAM 登录的完整说明见站内文档 `/{locale}/docs/oauth`，可在 `/{locale}/oauth/playground` 用已注册客户端模拟全流程。

| 端点                        | 说明                                                |
| --------------------------- | --------------------------------------------------- |
| `/{locale}/oauth/authorize` | 授权同意页（需登录）                                |
| `POST /oauth/token`         | `authorization_code` / `refresh_token` 换票         |
| `GET /oauth/userinfo`       | `Authorization: Bearer <access_token>` 获取用户信息 |
| `POST /oauth/revoke`        | RFC 7009 撤销 token                                 |

机器端点没有 locale 前缀，也不经过会话中间件。客户端在 `/{locale}/developer/apps` 管理（注册、轮换 secret）。

---

## 目录结构

| 路径                  | 说明                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/app/[locale]/`   | App Router 公开 / 业务页面：首页、项目、团队、登录注册、文档、OAuth 授权与 Playground、pamenv 设备授权          |
| `src/pages/[locale]/` | Pages Router 登录后的控制台：`admin/*`、`developer/apps`、`account`                                             |
| `src/app/api/`        | 业务 API（`/api/pam/*`、`/api/user/*`、`/api/admin/*`、`/api/pam/cli/*` 等）                                    |
| `src/app/oauth/`      | OAuth 机器端点（token、userinfo、revoke）                                                                       |
| `src/proxy.ts`        | 中间件：locale、登录态与管理员门禁                                                                              |
| `server/`             | 服务端：`controllers`、`services`、`repositorys`、`providers`、`serverIoc.ts`、`ServerConfig.ts`                |
| `shared/`             | 前后端共享：路由（`config/route.ts`）、站点设置定义（`config/pamSiteSettings.ts`）、i18n 标识与映射、Zod schema |
| `makes/sql/`          | 数据库全量与升级脚本                                                                                            |
| `tools/`              | 生成 API 路由、多语言、主题 CSS                                                                                 |
| `docs/`               | i18n 约定、Supabase 错误说明、原型稿                                                                            |
| `__tests__/`          | Vitest 单元测试                                                                                                 |

页面访问控制集中在 `shared/config/route.ts`：`AUTH_ROUTES` 为公开页，`LOGINED_PAGES` 需要登录，`/admin/*` 还要求平台管理员。

---

## 开发命令

```bash
pnpm lint:fix     # ESLint 自动修复
pnpm type-check   # TypeScript 检查
pnpm test         # Vitest
pnpm format       # Prettier
```

提交前须通过 `lint:fix` 与 `type-check`。
