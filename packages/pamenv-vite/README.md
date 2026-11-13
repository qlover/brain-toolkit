# @pamenv/vite

在 Vite 解析配置之前，把 PAM 环境写进当前进程的 `process.env`。`dev` / `build` 脚本可以继续是普通的 `vite`，不必再包 `pamenv run`。

与 [`@pamenv/next`](https://www.npmjs.com/package/@pamenv/next) 同构：`enabled` / `dev` / `ci` / `oidc`。

```bash
pnpm add @pamenv/vite pamenv-cli
# 或 npm i @pamenv/vite pamenv-cli
```

```ts
import { defineConfig } from 'vite';
import pamenv from '@pamenv/vite';

export default defineConfig({
  plugins: [
    pamenv({
      slug: 'my-app',
      env: process.env.PAM_ENV ?? 'local',
      oidc: 'github',
      keepEnv: ['APP_ENV'],
      // 默认 PAM 优先；本地临时改 .env / process 测值时用 'local'
      // envPriority: 'local',
      debug: process.env.PAMENV_DEBUG === '1',
      clientPublicPrefixes: ['VITE_']
    })
  ]
});
```

也可用命名导出：`import { createPamenvPlugin } from '@pamenv/vite'`。

## 启用时机

| | 说明 |
| --- | --- |
| `enabled` | 总开关。`false` 永不注入；省略/`true` 交给自动时机。`PAMENV_ENABLED=0` 强制关 |
| `dev` | 本地 `vite` / `vite dev`（`serve`）。默认 true |
| `ci` | 匹配 CI 的 `vite build`。默认：传了 `oidc` 时为 true |
| `oidc` | `'github'` / `'vercel'`。仅在对应 CI 生效；本地忽略，仍走 `.pam` |

自动时机：

- **本地**：仅 `serve`（除非 `dev: false`）
- **`GITHUB_ACTIONS` + `oidc: 'github'`**：`vite build` 注入
- **`VERCEL=1` + `oidc: 'vercel'`**：`vite build` 注入

匹配 CI 的 build 默认还会写出密封快照 `.pam/deploy-snapshot.json`（可用 `snapshotPath` 覆盖）。纯 SPA 运行时通常不需解封；密钥已在构建期进入 `import.meta.env.VITE_*`。

## 本地登录

Token 解析与 CLI 自动模式一致：优先向上查找最近的项目 `.pam`；没有则回落 `~/.pam`（全局登录）。仓库内已有 `.pam` 但未登录时：

```bash
pamenv login --local
```

仅全局登录过时，可直接 `pamenv login`（写入 `~/.pam`），Vite 插件也能用。

## GitHub Actions 示例

```yaml
permissions:
  id-token: write
  contents: read

env:
  PAMENV_BASE_URL: https://pam.qlover.top
  PAM_OIDC_AUD: https://pam.qlover.top
  PAM_ENV: dev

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm --filter @pamenv/vite run build
      - run: pnpm --filter pamenv-vite-app run build:ci
```

仓库内示例：`apps/pamenv-vite-app`；OIDC smoke：`.github/workflows/pamenv-github-oidc-smoke.yml`。

更多设计见 [pamenv docs](https://pam.qlover.top/docs/cli) 与 `packages/pamenv/docs/ci-github.md`。
