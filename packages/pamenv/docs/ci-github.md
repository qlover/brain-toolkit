# GitHub Actions OIDC + pamenv

本页对应分支 `feat/pam-cli-ci-github`。用 GitHub Actions 的 OIDC `id_token` 换 **15 分钟** `pam_cli`，再 `pamenv run` 注入变量。**无需 bot 密码、无需 `.pam`。**

## 前置

1. 在 PAM 项目「基本信息」→ **CI / GitHub Actions** 绑定 `owner/repo`（须与 Actions `repository` claim 一致）。
2. 部署已包含 `/api/pam/cli/oidc/exchange` 的 PAM；对现有库执行 [`apps/pam/makes/sql/004-pam-ci-oidc.sql`](../../../apps/pam/makes/sql/004-pam-ci-oidc.sql)。
3. Actions 的 `audience` 与站点一致（默认 `SITE_URL` 去尾斜杠；可设 `PAM_OIDC_GITHUB_AUDIENCE` / 站点设置 `auth.oidc_github_audience`）。
4. CI 身份角色为 `team_ci_runner`：**仅 inject**。受保护环境默认无法 resolve（需 export）。

## 换票

```http
POST /api/pam/cli/oidc/exchange
Content-Type: application/json

{ "provider": "github", "idToken": "<ACTIONS_ID_TOKEN>" }
```

成功响应与 CLI token 同形：`{ token, expiresAt, user }`。把 `token` 放进 `PAMENV_TOKEN`，不要写盘。

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
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - id: pam
        run: |
          set -euo pipefail
          ID_TOKEN=$(curl -sS -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "${ACTIONS_ID_TOKEN_REQUEST_URL}&audience=${PAM_OIDC_AUD}" | jq -r .value)
          TOKEN=$(curl -fsS -X POST "$PAMENV_BASE_URL/api/pam/cli/oidc/exchange" \
            -H 'Content-Type: application/json' \
            -d "{\"provider\":\"github\",\"idToken\":\"$ID_TOKEN\"}" | jq -r .data.token)
          echo "::add-mask::$TOKEN"
          echo "token=$TOKEN" >> "$GITHUB_OUTPUT"
      - run: pnpm pamenv run my-app -e prod -- pnpm build
        env:
          PAMENV_TOKEN: ${{ steps.pam.outputs.token }}
          PAMENV_BASE_URL: ${{ env.PAMENV_BASE_URL }}
```

## 安全注意

| 做 | 不做 |
| --- | --- |
| 绑定精确 `owner/repo` | 把长票 / bot 密码塞进 Actions secrets 当主路径 |
| job 内换票，短票只进 env | 把 `PAMENV_TOKEN` 打进日志 / artifact |
| 最小 CI 角色（仅 inject） | 给 CI 用户 admin / export（除非明确需要受保护环境） |

## 与 bot 密码路径

自建机 / 无 OIDC 的过渡方案见 [ci-bot.md](./ci-bot.md)。有 GitHub Actions 时优先本页 OIDC。
