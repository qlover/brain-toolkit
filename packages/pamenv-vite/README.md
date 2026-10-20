# @pamenv/vite

在 Vite 解析配置之前，把 PAM 环境写进当前进程的 `process.env`。`dev` 脚本可以继续是 `vite`，不必再包 `pamenv run`。

```bash
pnpm add @pamenv/vite pamenv-cli
# 或 npm i @pamenv/vite pamenv-cli
```

依赖 `pamenv-cli`（注入与登录逻辑）。项目目录需有可用的 `.pam`（与 CLI 相同）。

```ts
import { defineConfig } from 'vite';
import pamenv from '@pamenv/vite';

export default defineConfig({
  plugins: [
    pamenv({
      slug: 'my-app',
      env: 'local',
      keepEnv: ['APP_ENV'],
      // 默认 PAM 优先；本地临时改 .env / process 测值时用 'local'
      // envPriority: 'local',
      debug: process.env.PAMENV_DEBUG === '1'
    })
  ]
});
```

也可用命名导出：`import { createPamenvPlugin } from '@pamenv/vite'`（与 `@pamenv/next` 同名）。

Token 来自**当前项目**的 `.pam`（默认 `preferLocal: true`，不会用 `~/.pam`），不要写进配置对象。未登录时请在项目目录执行：

```bash
pamenv login --local
```

`enabled: false` 时不请求 PAM。未传 `enabled` 时只在 **`vite` / `vite dev`（serve）** 注入；`vite build` 默认跳过。需要构建期注入时设 `enabled: true`，或 `enabled: (command) => command === 'serve' || command === 'build'`。

`debug` 默认 `false`；`envPriority` 默认 `remote`（与 CLI / `@pamenv/next` 相同）。

`clientPublicPrefixes` 可覆盖「敏感 + 公开前缀」告警用的前缀（如 `['VITE_']`）；传 `[]` 关闭该告警。
