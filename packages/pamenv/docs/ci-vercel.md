# Vercel OIDC + pamenv

本页对应分支 `feat/pam-cli-ci-vercel`。用 Vercel 的 OIDC `id_token` 换 **15 分钟** `pam_cli`，再 `pamenv run` 注入变量。**无需 bot 密码、无需 `.pam`。**

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

## Build 示例（`@vercel/oidc`）

```ts
// scripts/pam-exchange.ts — 在 build / install 前换票
import { getVercelOidcToken } from '@vercel/oidc';

const PAMENV_BASE_URL = process.env.PAMENV_BASE_URL!;
const audience =
  process.env.PAM_OIDC_AUD ?? PAMENV_BASE_URL.replace(/\/$/, '');

async function main(): Promise<void> {
  const idToken = await getVercelOidcToken({ audience });
  const res = await fetch(`${PAMENV_BASE_URL}/api/pam/cli/oidc/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'vercel', idToken })
  });
  if (!res.ok) {
    throw new Error(`OIDC exchange failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: { token: string } };
  process.env.PAMENV_TOKEN = json.data.token;
  // 随后: pamenv run my-app -e prod -- <build>
}

void main();
```

`package.json` 示例：

```json
{
  "scripts": {
    "build": "node scripts/pam-exchange.ts && pamenv run my-app -e prod -- next build"
  }
}
```

Vercel 项目需启用 OIDC；本地 `vercel build` / 云端 Build 均可拿到 token（以当前 Vercel 文档为准）。

## Function / Runtime 示例

```ts
import { getVercelOidcToken } from '@vercel/oidc';

export async function resolvePamToken(): Promise<string> {
  const base = process.env.PAMENV_BASE_URL!;
  const audience = (process.env.PAM_OIDC_AUD ?? base).replace(/\/$/, '');
  const idToken = await getVercelOidcToken({ audience });
  const res = await fetch(`${base}/api/pam/cli/oidc/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'vercel', idToken })
  });
  if (!res.ok) {
    throw new Error(`OIDC exchange failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: { token: string } };
  return json.data.token;
}
```

短票只进内存 / 当次请求 env，勿写入日志或 artifact。

## 安全注意

| 做 | 不做 |
| --- | --- |
| 绑定精确 `team/project` | 把长票 / bot 密码塞进 Vercel env 当主路径 |
| build / function 内换票，短票只进 env | 把 `PAMENV_TOKEN` 打进日志 / artifact |
| 最小 CI 角色（仅 inject） | 给 CI 用户 admin / export（除非明确需要受保护环境） |

## 相关

- GitHub Actions：[ci-github.md](./ci-github.md)
- 总览：[pamenv-v2.md](./pamenv-v2.md)
- 自建机 / 无 OIDC：[ci-bot.md](./ci-bot.md)
