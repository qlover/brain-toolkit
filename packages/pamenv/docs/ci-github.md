# GitHub Actions OIDC + pamenv

用 GitHub Actions 的 OIDC `id_token` 换 **15 分钟** `pam_cli`，再注入 PAM 变量。**无需 bot 密码、无需 `.pam`。**

推荐直接用 CLI（`pamenv run --oidc github` / `pamenv oidc exchange --provider github`）；不必手写 curl 换票。

## 前置

1. 在 PAM 项目「基本信息」→ **CI / GitHub Actions** 绑定 `owner/repo`（须与 Actions `repository` claim 一致）。
2. 部署已包含 `/api/pam/cli/oidc/exchange` 的 PAM；对现有库执行 [`apps/pam/makes/sql/004-pam-ci-oidc.sql`](../../../apps/pam/makes/sql/004-pam-ci-oidc.sql)（或完整 `000`）。
3. Actions 的 `audience` 与站点一致（默认 `SITE_URL` 去尾斜杠；可设 `PAM_OIDC_AUD` / 站点设置 `auth.oidc_github_audience`）。
4. CI 身份角色为 `team_ci_runner`：**仅 inject**。受保护环境默认无法 resolve（需 export）。
5. Workflow 须：`permissions: id-token: write`（以及通常的 `contents: read`）。

## CLI（推荐）

```bash
# 仅换票（排错；默认不把 token 打到 stdout）
PAMENV_BASE_URL=https://pam.qlover.top \
  pamenv oidc exchange --provider github

# 换票 + inject + 跑命令
PAMENV_BASE_URL=https://pam.qlover.top \
  pamenv run my-app -e prod --oidc github -- pnpm build
```

`PAM_OIDC_AUD` 可选；省略时 audience 与 `PAMENV_BASE_URL` 同源。

## Workflow 示例

```yaml
permissions:
  id-token: write
  contents: read

env:
  PAMENV_BASE_URL: https://pam.qlover.top
  PAM_OIDC_AUD: https://pam.qlover.top   # 与 PAM 站点 audience 一致

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm --filter pamenv-cli run build   # monorepo 示例
      - run: pnpm pamenv run my-app -e prod --oidc github -- pnpm build
        env:
          PAMENV_BASE_URL: ${{ env.PAMENV_BASE_URL }}
          PAM_OIDC_AUD: ${{ env.PAM_OIDC_AUD }}
```

## 本仓 smoke（`qlover/brain-toolkit`）

不必另找业务仓库：用本仓 Actions 验通即可。

| 项 | 值 |
| --- | --- |
| PAM 项目 slug | `pamenv-ci-smoke` |
| 环境 | `dev`（非受保护） |
| 探测键 | `PAMENV_CI_SMOKE=1`（CLI）；`VITE_PAMENV_CI_SMOKE=1`（`@pamenv/vite` build） |
| GitHub 绑定 | `qlover/brain-toolkit` |
| Workflow | [`.github/workflows/pamenv-github-oidc-smoke.yml`](../../../.github/workflows/pamenv-github-oidc-smoke.yml) |
| 触发 | Actions → **pamenv GitHub OIDC smoke** → Run workflow（合入 master 后）；或本功能分支 push |

成功日志应出现 OIDC 换票成功提示（**不含** token）、CLI 的 `PAMENV_CI_SMOKE present`，以及 vite job 的 build 注入成功。

### `@pamenv/vite` 构建注入

示例应用 [`apps/pamenv-vite-app`](../../../apps/pamenv-vite-app) 配置 `oidc: 'github'`：在 Actions 上 `vite build` 时由插件换票并注入（不必再包 `pamenv run`）。详见 [`packages/pamenv-vite/README.md`](../../pamenv-vite/README.md)。

## 换票 API（底层）

CLI 内部调用：

```http
POST /api/pam/cli/oidc/exchange
Content-Type: application/json

{ "provider": "github", "idToken": "<ACTIONS_ID_TOKEN>" }
```

成功响应与 CLI token 同形：`{ token, expiresAt, user }`。短票只进进程环境，不要写盘、不要打进日志 / artifact。

## 安全注意

| 做 | 不做 |
| --- | --- |
| 绑定精确 `owner/repo` | 把长票 / bot 密码塞进 Actions secrets 当主路径 |
| job 内换票，短票只进 env | 把 `PAMENV_TOKEN` 打进日志 / artifact |
| 最小 CI 角色（仅 inject） | 给 CI 用户 admin / export（除非明确需要受保护环境） |

## 相关

- Vercel：[ci-vercel.md](./ci-vercel.md)
- 自建机 / 无 OIDC：[ci-bot.md](./ci-bot.md)。有平台 OIDC 时优先本页 / Vercel 页。
