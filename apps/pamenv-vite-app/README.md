# pamenv-vite-app

用于验证 `@pamenv/vite` 的示例应用（本地 serve + GitHub Actions `vite build` OIDC）。

复用 PAM 项目 **`pamenv-ci-smoke`**（与本仓 GitHub OIDC smoke 相同），避免再开项目。

## 前置（PAM）

1. 项目 slug：`pamenv-ci-smoke`，环境 `local` / `dev`
2. GitHub CI 绑定：`qlover/brain-toolkit`
3. `dev`（及本地需要的 `local`）含公开前缀键，例如：
   - `VITE_PAMENV_CI_SMOKE=1`（CI 断言用）
   - 可选：`VITE_SITE_URL` 等

## 本地

```bash
# 在 apps/pamenv-vite-app 下登录到本项目 .pam
pnpm pamenv:login
# 即：pamenv login --local

pnpm dev
# PAM_ENV=local vite
```

`PAMENV_DEBUG=1 pnpm dev` 可查看注入元数据（不含密钥值）。

## CI（GitHub Actions）

插件配置了 `oidc: 'github'`：在 Actions 上跑 `vite build` 时自动换票并注入。

本仓 workflow：`.github/workflows/pamenv-github-oidc-smoke.yml`（含 vite build job）。

客户端可读键须带 `VITE_` 前缀（见 `clientPublicPrefixes`）。
