# 项目发布指南

本文档介绍 brain-toolkit 基于 [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release) **5.x** 的自动化发布流程（与 fe-base 对齐）。

## 发布概述

```
feature/*  ──PR──►  master  ──fe-release──►  release/*  ──PR──►  master  ──►  npm
                 (+ preRelease)              (+ CI-Release)
```

| 阶段 | 触发条件 | 作用 |
| --- | --- | --- |
| 1. 功能 PR | PR → `master` | `general-check`：lint / test / build / type-check |
| 2. 创建 Release PR | 合并到 `master` 且带 **`preRelease`**（或手动 `workflow_dispatch`） | 检测变更包、升版本、写 changelog、打开 `release/*` PR |
| 3. 发布 | `release/*` → `master` 且带 **`CI-Release`** | `changeset publish`、推 tag、创建 GitHub Release |

> **不要**在功能 PR 上打 `CI-Release`。需要发布时请打 **`preRelease`**。

## 发布流程

### 1. 功能分支与 PR

```bash
git checkout master
git pull origin master
git checkout -b feature/your-feature-name

# 开发并按 Conventional Commits 提交
git add .
pnpm commit   # 或 git commit -m "feat(brain-user): ..."
git push origin feature/your-feature-name
```

在 GitHub 上创建指向 `master` 的 PR。`general-check` 会自动跑质量检查。

### 2. 合并前打标签

| 标签 | 谁加 | 作用 |
| --- | --- | --- |
| `preRelease` | **手动**（功能 PR） | 合并后触发「创建 Release PR」 |
| `increment:major` / `increment:minor` / `increment:patch` | 可选 | 覆盖默认 patch 递增 |
| `CI-Release` | **系统自动**（挂在 `release/*` PR 上） | 标识发布 PR；合并后触发 publish |

变更包由 **git diff** 检测（相对 PR base SHA），**不再依赖** `changes:*` 标签。

### 3. 创建 Release PR

带 `preRelease` 的功能 PR 合并进 `master` 后，`release.yml` → `create-release-pr`：

1. 构建、type-check、lint、test
2. 运行：

```bash
npx fe-release -V -s master -i <increment> \
  --workspaces.compare-ref <PR_BASE_SHA> \
  --changesetVersion.ignore-non-updated-packages
```

3. 推送 `release/<repo>-<id>` 并打开带 `CI-Release` 的 Release PR

也可在 Actions 里手动跑 **Release sub packages**（`workflow_dispatch`），无需 `preRelease`。

### 4. 合并 Release PR 并发布

`release/*` + `CI-Release` 合并进 `master` 后，`publish` job：

```bash
npx fe-release -V \
  --workspaces.compare-ref <PR_BASE_SHA> \
  --changesetVersion.skip-changeset \
  --changesetVersion.mode publish \
  --github.mode createRelease \
  --github.ignore-release-paths examples,apps
```

效果：npm publish、推送 git tag、按包创建 GitHub Release（跳过 `examples` / `apps`）。

若 `fe-config.json` 中 `github.autoMergeReleasePR` 为 `true`，Release PR 创建后可能自动合并。

## 配置

### fe-config.json

```json
{
  "protectedBranches": ["master", "develop"],
  "release": {
    "changesetVersion": {
      "changesetRoot": ".changeset",
      "ignoreNonUpdatedPackages": false,
      "dependencyReleaseTemplate": "- Update dependency **${name}** from `${oldVersion}` to `${newVersion}`",
      "formatTemplate": "\n- ${scopeHeader} ${commitlint.message} ${commitLink} ${prLink}",
      "commitBody": true
    },
    "github": {
      "autoMergeReleasePR": true,
      "pushChangeLabels": true,
      "commitArgs": ["--no-verify"],
      "ignoreReleasePaths": ["examples", "apps"]
    }
  }
}
```

| 配置 | 说明 |
| --- | --- |
| `changesetVersion.*` | Changesets 根目录、依赖包 changelog 模板、commit 格式与 types |
| `github.autoMergeReleasePR` | 是否自动合并 Release PR |
| `github.pushChangeLabels` | 是否把变更标签挂到 Release PR |
| `github.commitArgs` | 发布提交额外参数（如 `--no-verify`） |
| `github.ignoreReleasePaths` | 不创建 GitHub Release 的路径前缀 |

### GitHub Secrets

- `PAT_TOKEN`：创建 PR / 推 tag / GitHub Release
- `NPM_TOKEN`：发布到 npm

### 相关脚本

```bash
pnpm build:packages:force   # 强制构建 packages（排除 examples）
pnpm test:force             # 全量测试
pnpm release:branch         # 本地：升版本并推 release 分支（不建 PR）
```

## Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)，详见 [提交规范](./commit-convention.md)。

```bash
pnpm commit
```

| 类型 | 用途 | 示例 |
| --- | --- | --- |
| `feat` | 新功能 | `feat(element-sizer): add resize animation` |
| `fix` | 修复 | `fix(brain-user): resolve otp verify` |
| `docs` | 文档 | `docs: update release guide` |
| `refactor` / `perf` / `build` | 重构 / 性能 / 构建 | … |
| `chore` / `test` / `ci` | 杂项 / 测试 / CI（changelog 中默认隐藏） | … |

## 包发布策略

- 各包独立版本（如 `@brain-toolkit/element-sizer@1.2.0`）
- 内部依赖由 Changesets 自动 bump
- `examples`、`apps` 不参与 GitHub Release；仅 `packages/**` 变更会触发 release 工作流 path 过滤

## 故障排除

### Release PR 未创建

检查：

- 功能 PR 合并前是否带有 **`preRelease`**
- 是否改动了 `packages/**`
- head 是否为 `release/*`（`release/*` 合并不会再创建 Release PR）
- `PAT_TOKEN` 是否有效、Actions 是否跑通

### 版本不符合预期

- 检查 `increment:major` / `increment:minor` / `increment:patch`
- 确认 commit 符合 Conventional Commits

### 本地调试

```bash
# 干跑（不写改动）
npx fe-release --dry-run -V -s master \
  --changesetVersion.ignore-non-updated-packages

# 只推 release 分支、不建 PR
pnpm release:branch
```

### 构建 / 测试 / npm 失败

```bash
pnpm install
pnpm type-check
pnpm lint
pnpm test:force
pnpm build:packages:force

npm whoami
npm view @brain-toolkit/element-sizer version
```

## 最佳实践

- 合并功能 PR **前**确认已打 `preRelease`（需要发布时）
- 破坏性变更用 `increment:major`
- 发布前本地跑通 type-check / lint / test / build
- 紧急修复可合并后立即带 `preRelease`，或用 `workflow_dispatch` 从当前 master 建 Release PR

## 相关链接

- [提交规范](./commit-convention.md)
- [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [语义化版本](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
