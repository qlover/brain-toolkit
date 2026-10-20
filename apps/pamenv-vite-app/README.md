# pamenv-vite-app

用于验证 `@pamenv/vite` 的示例应用。

## 首次使用

```bash
# 在 apps/pamenv-vite-app 下登录到本项目 .pam（不要用全局 ~/.pam）
pnpm env:login
# 即：pamenv login --local

# 需在 PAM 上有 slug 为 pamenv-vite-app 的项目，并配置 local 环境
pnpm dev
```

未登录时插件会报错并提示执行 `pamenv login --local`。

`PAMENV_DEBUG=1 pnpm dev` 可查看注入元数据（不含密钥值）。
