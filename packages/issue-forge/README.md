# @brain-toolkit/issue-forge

Forge 无关的 Issue 网关；**GitHub App** 为第一个实现。可选子路径 **`/feedback`** 提供「反馈 → Issue」编排。

## `@brain-toolkit/issue-forge`（协议）

```ts
import {
  createGithubAppClient,
  createGithubAppIssueForge
} from '@brain-toolkit/issue-forge';

const client = createGithubAppClient({ cache });
const forge = createGithubAppIssueForge(client, authConfig);
await forge.createIssue({ title, body, labels: ['feedback'] });
```

## `@brain-toolkit/issue-forge/feedback`

包只做两件事：**拉模板** + **`{{var}}` 替换**。业务字段、文案、语种由应用在 Host 里组装 `variables`。

```ts
import { createGithubFeedbackIssueBundle } from '@brain-toolkit/issue-forge/feedback';

const bundle = createGithubFeedbackIssueBundle({
  host, // resolveIssueContent → { variables, labels, issueNumber }
  client,
  cache,
  defaultTemplate // 可选回退模板；语言写在模板里
});

await bundle.sync.syncFeedback(id);
```

应用（如 PAM）一个 Bundle：实现 Host、传入模板、兼 webhook 验签。
