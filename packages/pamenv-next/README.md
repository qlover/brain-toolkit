# @pamenv/next

在 Next 读取配置之前，把 PAM 环境写进当前进程的 `process.env`。`dev` 脚本可以继续是 `next dev`，不必再包 `pamenv run`。

```ts
import { createPamenvPlugin } from '@pamenv/next';

const withPamenv = createPamenvPlugin({
  slug: 'brain-oauth',
  env: 'local',
  keepEnv: ['APP_ENV']
});

export default withPamenv(withNextIntl(nextConfig));
```

Token 来自当前目录 `.pam`（与 CLI 相同），不要写进这个对象。`enabled: false` 时不请求 PAM，正式构建应关掉。未传 `enabled` 时只在 `next dev` 注入。
