# 项目发布指南

本文档详细介绍 brain-toolkit 项目的发布流程、配置和最佳实践。

## 📋 发布概述

brain-toolkit 使用自动化发布流程，基于 [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release) 工具实现。发布流程分为三个主要步骤：

1. **MergePR 阶段** - 自动检测包变更并添加标签
2. **ReleasePR 阶段** - 生成 changelog 和版本号
3. **发布阶段** - 自动发布到 GitHub 和 npm

## 🔄 发布流程详解

### 第一步：创建功能分支和 Pull Request

#### 1.1 创建功能分支

```bash
# 从 master 分支创建功能分支
git checkout master
git pull origin master
git checkout -b feature/your-feature-name

# 进行开发工作
# ... 修改代码 ...

# 提交更改 (遵循提交规范)
git add .
git commit -m "feat: add new feature"
git push origin feature/your-feature-name
```

> 💡 **提交规范**: 请参考 [提交规范指南](./commit-convention.md) 了解详细的提交信息格式要求。

#### 1.2 创建 Pull Request

在 GitHub 上创建 Pull Request，目标分支为 `master`。

#### 1.3 添加版本递增标签（可选）

在 PR 上添加以下标签来控制版本号递增：

- `increment:major` - 主版本号递增 (1.0.0 → 2.0.0)
- `increment:minor` - 次版本号递增 (1.0.0 → 1.1.0)  
- `increment:patch` - 补丁版本号递增 (1.0.0 → 1.0.1) **[默认]**

### 第二步：MergePR 自动化处理

当 PR 合并到 master 分支时，GitHub Actions 会自动执行以下操作：

#### 2.1 检测包变更

系统会自动分析 `packages/` 目录下的文件变更，为每个有修改的包添加标签：

```
changes:packages/element-sizer
changes:packages/package-a
```

#### 2.2 质量检查

```bash
# 自动执行的检查流程
pnpm lint      # 代码规范检查
pnpm test      # 运行测试套件
pnpm build     # 构建所有包
```

#### 2.3 生成 ReleasePR

如果所有检查通过，系统会：
- 自动生成每个包的 changelog
- 更新版本号
- 创建 ReleasePR

### 第三步：发布到仓库

#### 3.1 自动合并 ReleasePR

根据 `fe-config.json` 中的 `autoMergeReleasePR` 配置：

```json
{
  "release": {
    "autoMergeReleasePR": true  // 自动合并 ReleasePR
  }
}
```

#### 3.2 发布到 GitHub 和 npm

ReleasePR 合并后，系统会自动：
- 创建 Git 标签
- 发布 GitHub Release
- 发布包到 npm 仓库

## ⚙️ 发布配置

### fe-config.json 配置详解

```json
{
  "protectedBranches": ["master", "develop"],
  "release": {
    "autoMergeReleasePR": true,
    "githubPR": {
      "commitArgs": ["--no-verify"],
      "pushChangedLabels": true
    },
    "changelog": {
      "formatTemplate": "\n- ${scopeHeader} ${commitlint.message} ${commitLink} ${prLink}",
      "commitBody": true,
      "types": [
        { "type": "feat", "section": "#### ✨ Features", "hidden": false },
        { "type": "fix", "section": "#### 🐞 Bug Fixes", "hidden": false },
        { "type": "docs", "section": "#### 📝 Documentation", "hidden": false },
        { "type": "refactor", "section": "#### ♻️ Refactors", "hidden": false },
        { "type": "perf", "section": "#### 🚀 Performance", "hidden": false },
        { "type": "build", "section": "#### 🚧 Build", "hidden": false },
        { "type": "chore", "section": "#### 🔧 Chores", "hidden": true },
        { "type": "test", "section": "#### 🚨 Tests", "hidden": true },
        { "type": "style", "section": "#### 🎨 Styles", "hidden": true },
        { "type": "ci", "section": "#### 🔄 CI", "hidden": true },
        { "type": "revert", "section": "#### ⏪ Reverts", "hidden": true },
        { "type": "release", "section": "#### 🔖 Releases", "hidden": true }
      ]
    }
  }
}
```

#### 配置项说明

- **protectedBranches**: 受保护的分支列表
- **autoMergeReleasePR**: 是否自动合并 ReleasePR
- **commitArgs**: Git 提交时的额外参数
- **pushChangedLabels**: 是否推送变更标签
- **formatTemplate**: changelog 格式模板
- **types**: 提交类型配置，控制 changelog 的分组和显示

### GitHub Actions 配置

#### release.yml 工作流

```yaml
name: Release sub packages

on:
  pull_request:
    branches: [master]
    types: [closed]
    paths: [packages/**]

jobs:
  release-pull-request:
    # 当 PR 合并且不包含 CI-Release 标签时执行
    if: |
      github.event.pull_request.merged == true && 
      !contains(github.event.pull_request.labels.*.name, 'CI-Release')
    
  release:
    # 当 PR 合并且包含 CI-Release 标签时执行
    if: |
      github.event.pull_request.merged == true && 
      contains(github.event.pull_request.labels.*.name, 'CI-Release')
```

### 环境变量配置

需要在 GitHub 仓库设置中配置以下 Secrets：

```bash
# GitHub Personal Access Token (用于创建 PR 和 Release)
PAT_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# npm 发布令牌 (用于发布到 npm)
NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxx
```

## 📝 Commit 规范

### Conventional Commits

项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 提交类型

| 类型 | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(element-sizer): add resize animation` |
| `fix` | 修复 bug | `fix(element-sizer): resolve memory leak` |
| `docs` | 文档更新 | `docs: update installation guide` |
| `refactor` | 代码重构 | `refactor: optimize animation logic` |
| `perf` | 性能优化 | `perf: improve resize calculation` |
| `test` | 测试相关 | `test: add unit tests for resizer` |
| `build` | 构建相关 | `build: update rollup config` |
| `ci` | CI/CD 相关 | `ci: add release workflow` |
| `chore` | 其他杂项 | `chore: update dependencies` |

#### 作用域 (Scope)

- `element-sizer` - ElementSizer 包相关
- `docs` - 文档相关
- `config` - 配置文件相关
- `deps` - 依赖相关

### 使用 Commitizen

项目配置了 Commitizen 来帮助生成规范的提交信息：

```bash
# 使用交互式提交
pnpm commit

# 或者使用 git cz (如果全局安装了 commitizen)
git cz
```

## 🏷️ 标签管理

### 自动标签

系统会自动为有变更的包添加标签：

```
changes:packages/element-sizer    # 包变更标签
increment:minor                   # 版本递增标签
CI-Release                       # 发布标签 (系统自动添加)
```

### 手动标签管理

如果某个包不需要发布，可以手动移除对应的 `changes:` 标签：

1. 在 GitHub PR 页面找到标签
2. 点击标签旁的 ❌ 移除
3. 该包将不会包含在此次发布中

## 📦 包发布策略

### 独立版本管理

每个包都有独立的版本号，互不影响：

```
@brain-toolkit/element-sizer@1.2.0
@brain-toolkit/package-a@0.5.1
@brain-toolkit/package-b@2.1.0
```

### 依赖关系处理

- **内部依赖**: 包间依赖会自动更新版本号
- **外部依赖**: 需要手动管理版本范围

### 发布范围控制

可以通过标签控制哪些包参与发布：

```bash
# 只发布 element-sizer 包
# 移除其他包的 changes: 标签，保留 changes:packages/element-sizer
```

## 🔍 发布状态监控

### GitHub Actions 状态

在 GitHub 仓库的 Actions 页面可以查看：

- ✅ 构建状态
- ✅ 测试结果  
- ✅ 发布状态
- ❌ 失败原因

### npm 发布状态

检查包是否成功发布到 npm：

```bash
# 检查包版本
npm view @brain-toolkit/element-sizer versions --json

# 检查最新版本
npm view @brain-toolkit/element-sizer version
```

### GitHub Release

在 GitHub 仓库的 Releases 页面查看：

- 📋 Release Notes
- 📦 发布的包列表
- 🏷️ Git 标签
- 📅 发布时间

## 🚨 故障排除

### 常见问题

#### 1. 构建失败

**问题**: GitHub Actions 构建失败

**解决方案**:
```bash
# 本地验证构建
pnpm install
pnpm lint
pnpm test
pnpm build

# 检查错误日志
# 修复问题后重新提交
```

#### 2. 测试失败

**问题**: 单元测试或集成测试失败

**解决方案**:
```bash
# 本地运行测试
pnpm test

# 运行特定包的测试
pnpm --filter @brain-toolkit/element-sizer test

# 查看测试覆盖率
pnpm test:coverage
```

#### 3. npm 发布失败

**问题**: 包发布到 npm 失败

**可能原因**:
- npm 令牌过期或无效
- 包名已存在且版本号重复
- 网络连接问题

**解决方案**:
```bash
# 检查 npm 令牌
npm whoami

# 手动发布 (如果需要)
cd packages/element-sizer
npm publish

# 检查包名是否可用
npm view @brain-toolkit/element-sizer
```

#### 4. ReleasePR 未自动创建

**问题**: 合并 PR 后没有创建 ReleasePR

**检查项**:
- PR 是否包含 `packages/` 目录的变更
- GitHub Actions 是否正常运行
- PAT_TOKEN 是否有效
- 是否有 `changes:` 标签

#### 5. 版本号不正确

**问题**: 生成的版本号不符合预期

**解决方案**:
- 检查 PR 上的 `increment:` 标签
- 确认 commit 信息符合 [Conventional Commits 规范](./commit-convention.md)
- 查看 changelog 生成逻辑

#### 6. 提交信息不规范

**问题**: 提交信息不符合规范导致 changelog 生成错误

**解决方案**:
- 参考 [提交规范指南](./commit-convention.md)
- 使用 `pnpm commit` 进行交互式提交
- 修改历史提交信息（如果需要）

### 调试技巧

#### 1. 本地模拟发布

```bash
# 安装 fe-release 工具
npm install -g @qlover/fe-release

# 模拟发布流程 (不实际发布)
npx fe-release --dry-run -V

# 查看会生成的 changelog
npx fe-release --dry-run --changelog-only
```

#### 2. 查看详细日志

```bash
# 启用详细日志
npx fe-release -V --verbose

# 查看 GitHub Actions 日志
# 在 GitHub 仓库的 Actions 页面查看详细执行日志
```

#### 3. 手动发布

如果自动发布失败，可以手动执行：

```bash
# 1. 更新版本号
cd packages/element-sizer
npm version patch  # 或 minor/major

# 2. 生成 changelog
npx fe-release --changelog-only

# 3. 提交更改
git add .
git commit -m "chore: release element-sizer@x.x.x"

# 4. 创建标签
git tag @brain-toolkit/element-sizer@x.x.x

# 5. 推送到远程
git push origin master --tags

# 6. 发布到 npm
npm publish
```

## 🎯 最佳实践

### 1. 发布前检查清单

- [ ] 代码已通过所有测试
- [ ] 文档已更新
- [ ] 提交信息符合 [提交规范](./commit-convention.md)
- [ ] CHANGELOG 格式正确
- [ ] 版本号符合语义化版本规范
- [ ] 依赖关系已正确配置

### 2. 版本管理策略

- **补丁版本** (patch): 向后兼容的 bug 修复
- **次版本** (minor): 向后兼容的新功能
- **主版本** (major): 不向后兼容的重大更改

### 3. 发布时机

- **定期发布**: 每周或每两周发布一次
- **紧急修复**: 重要 bug 修复立即发布
- **功能发布**: 新功能完成后发布

### 4. 回滚策略

如果发布出现问题，可以：

```bash
# 1. 撤回 npm 包 (24小时内)
npm unpublish @brain-toolkit/element-sizer@x.x.x

# 2. 发布修复版本
npm version patch
npm publish

# 3. 更新文档说明问题
```

## 🔗 相关链接

- [提交规范指南](./commit-convention.md)
- [@qlover/fe-release 文档](https://www.npmjs.com/package/@qlover/fe-release)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [语义化版本规范](https://semver.org/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [npm 发布指南](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

## 📞 支持

如果在发布过程中遇到问题：

1. 查看 [GitHub Issues](https://github.com/qlover/brain-toolkit/issues)
2. 查看 GitHub Actions 执行日志
3. 联系项目维护者
4. 参考 [@qlover/fe-release](https://www.npmjs.com/package/@qlover/fe-release) 文档
