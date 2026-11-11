# Vercel OIDC + pamenv

用 Vercel 的 OIDC `id_token` 换 **15 分钟** `pam_cli`，再注入 PAM 变量。**无需 bot 密码、无需 `.pam`。**

与 GitHub 同模型：绑定 **PAM 项目**，不绑真人。同一项目可同时有 `github` + `vercel` 各一条，共用同一 CI 用户（`team_ci_runner`，仅 inject）。

## 前置

1. 在 PAM 项目「基本信息」→ **CI / OIDC** → **Vercel**，绑定 `teamSlug/projectName`（须与 Vercel claim `owner` + `project` 一致）。
2. 部署已包含 `/api/pam/cli/oidc/exchange` 的 PAM；对现有库执行 [`apps/pam/makes/sql/005-pam-ci-oidc-vercel.sql`](../../../apps/pam/makes/sql/005-pam-ci-oidc-vercel.sql)（或完整 `000`）。
3. Vercel 侧使用**自定义 audience** = PAM 站点（默认 `SITE_URL` 去尾斜杠；可设 `PAM_OIDC_VERCEL_AUDIENCE` / 站点设置 `auth.oidc_vercel_audience`）。
4. CI 身份角色为 `team_ci_runner`：**仅 inject**。受保护环境默认无法 resolve（需 export）。

> v1 **不**按 `environment`（production / preview / development）白名单；后续可扩展。

## 换票

```http
POST /api/pam/cli/oidc/exchange
Content-Type: application/json

{ "provider": "vercel", "idToken": "<VERCEL_OIDC_TOKEN>" }
```

成功响应与 CLI token 同形：`{ token, expiresAt, user }`。把 `token` 放进 `PAMENV_TOKEN`，不要写盘。

## 模型（只此两路，不做 `next.config.env` 内联）

| 场景 | 做法 |
| --- | --- |
| 本地 `next dev` | 插件 `injectPamenvProcessEnv` → 写**当前进程** `process.env`（同读 `.env`：非 `NEXT_PUBLIC_*` 不进前端包） |
| Vercel build | 同上 inject（构建机进程）+ 写出密封快照 |
| Vercel **runtime** | 新进程；须 `createPamenv` 解封 → **bag**（默认不写 `process.env`） |

**不要**把整包 PAM 密钥塞进 `next.config.env`（会进前端包）。例外：Edge middleware 无法解密封时，可用插件 `inlineEnv: ['SESSION_SECRET']` **只内联验 session 所需的极少键**；业务密钥仍走密封快照 + bag。

## Build（插件调度，不必包 `pamenv run`）

`@pamenv/next` 在读 `next.config` 时调用 `injectPamenvProcessEnv`（可传 `oidc: 'vercel'`），与 CLI `pamenv run --oidc` 同路。

`apps/pam` 统一一条 **`pnpm build`**：

1. 预构建 `@brain-toolkit/ts2locales`、`pamenv-cli`、`@pamenv/next`（monorepo dist）
2. `next build`（是否 OIDC 注入见下方「PAM 自托管」）
3. `next-sitemap`

**不要**再写成：

```bash
pamenv run "$SLUG" -e dev --oidc vercel -- next build
```

### PAM 自托管：同一 Build Command，Production / Preview 不同链路

Vercel 只有一个 Build Command，用 `VERCEL_ENV` 在 `apps/pam/next.config.ts` 分叉：

| `VERCEL_ENV` | 链路 | 密钥来源 |
| --- | --- | --- |
| **`production`** | 关 pamenv 插件；内联 `PAMENV_ENABLED=0` | **平台环境变量**（勿 OIDC 打自己） |
| **`preview`**（及本地非 production） | 开插件 + OIDC + 密封快照 | 打**已稳定的 Production PAM** resolve |

其它应用（如 brain-oauth）不受此限制，Production 也可继续走插件。

Vercel 项目设置：

| 项 | 值 |
| --- | --- |
| Root Directory | `apps/pam` |
| Build Command Override | `pnpm run build`（不要写裸 `next build`，否则会跳过 monorepo 预构建） |
| `PAM_ENV` / `NODE_ENV` | 脚本内固定 `PAM_ENV=dev`、`NODE_ENV=production` |

Vercel 环境变量：

| 变量 | Production | Preview |
| --- | --- | --- |
| `SITE_URL`、`SUPABASE_*`、`SESSION_SECRET`… | **必填**（平台变量） | 一般由 OIDC resolve；也可手填覆盖 |
| `PAMENV_PROJECT_SLUG` | 不需要 | PAM 项目 id 或 slug |
| `PAMENV_BASE_URL` | 不需要 | PAM 根，如 `https://pam.qlover.top` |
| `PAM_OIDC_AUD` | 不需要 | 可选；默认同 `PAMENV_BASE_URL` |
| `PAMENV_ENABLED` | 构建已内联 `0`；仪表盘也可再设 `0` | 不设或 `1`（开插件） |

单独排错换票（不注入）：

```bash
PAMENV_BASE_URL=https://pam.qlover.top pamenv oidc exchange --provider vercel
```

Vercel 项目需启用 OIDC；云端 Build / Function 可拿到 id_token。`@vercel/oidc` 已是 `pamenv-cli` 的 dependencies。

## Runtime（解封部署快照 → bag）

`next.config` 插件在 **CI `next build`** 注入后写出**密封部署快照**（产物内无明文；含 `wrappedDek`）。

运行时解封（路径由 `@pamenv/next` 约定为 `.pam/deploy-snapshot.json`）返回 **`PamenvBag`**，**默认不写** `process.env`：

```ts
import { createPamenv } from '@pamenv/next';
const bag = await createPamenv(); // 整表按键解密（快照 v2）
bag.get('SESSION_SECRET');
await createPamenv({ only: 'SESSION_SECRET' });
await createPamenv({ writeProcessEnv: true }); // 仅遗留裸读需要时
```

入口：`proxy`（`only` 名单；缺键抛错）、`createBootstrapServer` / `NextApiServer.run`（全量）。
流程：OIDC → unwrap DEK → 按名单 AES → **bag** → `ServerConfig.bindPamenvBag(bag)`（袋优先，平台键回落 process）。
旧 v1 整包快照仍可读。快照只含 PAM resolve 的键；`APP_ENV` 等平台键不要塞进 `only`。

`next.config` 须 `outputFileTracingIncludes` 打进 `.pam/deploy-snapshot.json`。**改 PAM 变量须重新 build/部署**。

自建 Docker / 常驻 Node：仍可用 `PAMENV_TOKEN` + `pamenv run -- next start`（进程级，无需袋）。

## 平台矩阵

| 场景 | 进程级插件 | 运行时 bag |
| --- | --- | --- |
| 本地 / 自建同进程 | ✅ | 不需要 |
| Vercel build | ✅ 写密封快照 | — |
| Vercel runtime | ❌ | ✅ 默认不写 process |
| Vercel Edge | ❌ | ❌；`inlineEnv` 极少键 |

## 安全注意

| 做 | 不做 |
| --- | --- |
| 绑定精确 `team/project` | 把长票 / bot 密码塞进 Vercel env 当主路径 |
| build / runtime 内换票，短票只进 env | 把 `PAMENV_TOKEN` 打进日志 / artifact |
| 最小 CI 角色（仅 inject） | 给 CI 用户 admin / export（除非明确需要受保护环境） |
| runtime 用 bag；进程级才写 `process.env` | 用 `next.config.env` 内联密钥（会进前端包） |

## 相关

- GitHub Actions：[ci-github.md](./ci-github.md)
- 总览：[pamenv-v2.md](./pamenv-v2.md)
- 自建机 / 无 OIDC：[ci-bot.md](./ci-bot.md)
