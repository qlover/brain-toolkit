# @pamenv/next

在 Next 读取配置之前，把 PAM 环境写进当前进程的 `process.env`。`dev` 脚本可以继续是 `next dev`，不必再包 `pamenv run`。

```bash
pnpm add @pamenv/next pamenv-cli
# 或 npm i @pamenv/next pamenv-cli
```

依赖 `pamenv-cli`（注入与登录逻辑）。从项目目录向上需有可用的 `.pam`（与 CLI 相同；monorepo 可在仓库根登录一次）。

```ts
import { createPamenvPlugin } from '@pamenv/next';

const withPamenv = createPamenvPlugin({
  slug: 'pam',
  env: process.env.PAM_ENV,
  keepEnv: ['PAM_ENV', 'VERCEL', 'VERCEL_ENV', 'NODE_ENV'],
  oidc: 'vercel',
  debug: true,
  enabled: true
});

export default withPamenv(withNextIntl(nextConfig));
```

Token 来自向上查找的最近 `.pam`（默认 `preferLocal: true`，不会用 `~/.pam`），不要写进这个对象。未登录时请在仓库根或项目目录执行 `pamenv login --local`。

### 总开关与自动时机

| 选项 | 含义 |
| --- | --- |
| `enabled` | **总开关**：`false` 整插件不注入；省略 / `true` 允许注入 |
| （内部）自动时机 | 本地仅 `next dev`；有 `oidc` 且在匹配 CI 时 production build/server |
| `dev` / `ci` | 分别关掉本地或 CI 侧的自动时机 |

`PAMENV_PROJECT_SLUG` / `PAMENV_ENV_NAME` 优先于入参 `slug` / `env`。`debug` 可传 `true`；省略则读 `PAMENV_DEBUG`。

### 两层 API（进程级 / 运行时级）

| API | 时机 |
| --- | --- |
| `createPamenvPlugin`（进程级） | **本地** `next dev`：inject → 当前进程 `process.env`；**CI** `next build`：inject + 写密封快照 |
| `createPamenv`（运行时级） | **Vercel runtime**：解封 → 返回 `PamenvBag`；**默认不写** `process.env`。Edge 内 no-op（空袋） |

```ts
import { createPamenv } from '@pamenv/next';

const bag = await createPamenv(); // 整表按键解密（快照 v2）→ PamenvBag
bag.get('SESSION_SECRET');
const only = await createPamenv({ only: ['SESSION_SECRET'] });
// 遗留裸读 process.env 时才开：
await createPamenv({ writeProcessEnv: true });
```

| 参数 | 含义 | 默认 |
| --- | --- | --- |
| `only` | 白名单；缺键且进程也没有 → **抛错**；袋内只含这些键 | 不传 = 全部 |
| `omit` | 黑名单（与 `only` 互斥） | 不传 = 不排除 |
| `keepEnv` | `writeProcessEnv: true` 时：进程已有则不覆盖 | runtime 内置 CI 键 |
| `cache` | 进程内解封缓存 | `true` |
| `writeProcessEnv` | 是否把袋写入 `process.env` | **`false`** |

应用侧把袋挂到配置（袋优先，平台键回落 process）：

```ts
const bag = await createPamenv();
serverConfig.bindPamenvBag(bag);
```

### 平台矩阵

见主包 `packages/pamenv/README.md`。
