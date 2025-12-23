# 提交规范指南

本文档详细介绍 brain-toolkit 项目的提交信息规范，基于 [Conventional Commits](https://www.conventionalcommits.org/) 标准。

## 📋 规范概述

### 为什么需要提交规范？

1. **自动化 CHANGELOG 生成** - 根据提交类型自动生成版本日志
2. **语义化版本控制** - 自动确定版本号递增类型
3. **提高代码可读性** - 清晰的提交历史便于代码审查
4. **团队协作效率** - 统一的格式降低沟通成本
5. **CI/CD 集成** - 支持自动化发布流程

### 基本格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## 🏷️ 提交类型 (Type)

### 主要类型

| 类型       | 描述                   | 版本影响 | 显示在 CHANGELOG |
| ---------- | ---------------------- | -------- | ---------------- |
| `feat`     | 新功能                 | Minor    | ✅               |
| `fix`      | Bug 修复               | Patch    | ✅               |
| `docs`     | 文档更新               | -        | ✅               |
| `refactor` | 代码重构               | -        | ✅               |
| `perf`     | 性能优化               | Patch    | ✅               |
| `build`    | 构建系统或外部依赖变更 | -        | ✅               |

### 辅助类型

| 类型     | 描述       | 版本影响 | 显示在 CHANGELOG |
| -------- | ---------- | -------- | ---------------- |
| `test`   | 测试相关   | -        | ❌               |
| `chore`  | 其他杂项   | -        | ❌               |
| `style`  | 代码格式化 | -        | ❌               |
| `ci`     | CI/CD 配置 | -        | ❌               |
| `revert` | 回滚提交   | -        | ❌               |

### 特殊类型

| 类型              | 描述       | 版本影响 | 显示在 CHANGELOG |
| ----------------- | ---------- | -------- | ---------------- |
| `BREAKING CHANGE` | 破坏性变更 | Major    | ✅               |
| `release`         | 发布相关   | -        | ❌               |

## 🎯 作用域 (Scope)

作用域用于指明提交影响的范围，使用小写字母。

### 包作用域

```bash
feat(element-sizer): add auto-resize feature
fix(element-sizer): resolve memory leak issue
test(element-sizer): add unit tests for animation
```

### 功能作用域

```bash
feat(animation): add fade transition effect
fix(utils): correct type definitions
docs(api): update method documentation
```

### 配置作用域

```bash
build(rollup): update bundle configuration
ci(github): add release workflow
chore(deps): update dependencies
```

### 通用作用域

```bash
docs(readme): update installation guide
style(lint): fix eslint warnings
test(setup): configure vitest environment
```

## 📝 描述 (Description)

### 编写原则

1. **使用祈使句** - "add feature" 而不是 "added feature"
2. **首字母小写** - "add new component" 而不是 "Add new component"
3. **不要句号结尾** - "fix bug" 而不是 "fix bug."
4. **简洁明了** - 控制在 50 个字符以内
5. **描述做了什么** - 而不是为什么做

### 好的描述示例

```bash
✅ add resize animation support
✅ fix memory leak in event listeners
✅ update installation documentation
✅ refactor animation logic for better performance
✅ remove deprecated API methods
```

### 不好的描述示例

```bash
❌ Added new feature
❌ Fixed some bugs
❌ Updated stuff
❌ Changes
❌ WIP
```

## 📄 提交体 (Body)

### 何时使用

- 需要解释**为什么**做这个变更
- 变更比较复杂，需要详细说明
- 包含破坏性变更的详细信息

### 格式要求

- 与标题之间空一行
- 每行不超过 72 个字符
- 使用祈使句
- 可以包含多个段落

### 示例

```bash
feat(element-sizer): add auto-resize feature

Add automatic resize detection for elements when container size changes.
This feature uses ResizeObserver API for better performance compared to
polling-based solutions.

The implementation includes:
- ResizeObserver integration
- Debounced resize handling
- Fallback for older browsers
```

## 🔗 页脚 (Footer)

### 破坏性变更

```bash
feat(api): change method signature

BREAKING CHANGE: The `resize()` method now requires an options parameter.
Migration: `resize()` -> `resize({ animate: true })`
```

### 关联 Issue

```bash
fix(element-sizer): resolve animation timing issue

Fixes #123
Closes #456
Refs #789
```

### 共同作者

```bash
feat(animation): add new transition effects

Co-authored-by: John Doe <john@example.com>
Co-authored-by: Jane Smith <jane@example.com>
```

## 🛠️ 工具配置

### Commitizen 配置

项目已配置 Commitizen 来帮助生成规范的提交信息。

#### 安装和使用

```bash
# 使用项目配置的 commitizen
pnpm commit

# 或者全局安装后使用
npm install -g commitizen
git cz
```

#### 交互式提交流程

```bash
$ pnpm commit

? Select the type of change that you're committing: (Use arrow keys)
❯ feat:     A new feature
  fix:      A bug fix
  docs:     Documentation only changes
  style:    Changes that do not affect the meaning of the code
  refactor: A code change that neither fixes a bug nor adds a feature
  perf:     A code change that improves performance
  test:     Adding missing tests or correcting existing tests

? What is the scope of this change (e.g. component or file name): element-sizer

? Write a short, imperative tense description of the change:
 add auto-resize feature

? Provide a longer description of the change: (press enter to skip)
 Add automatic resize detection using ResizeObserver API

? Are there any breaking changes? No

? Does this change affect any open issues? Yes

? Add issue references (e.g. "fix #123", "re #123".):
 closes #123
```

### Commitlint 配置

项目使用 commitlint 来验证提交信息格式。

#### 配置文件

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'element-sizer',
        'docs',
        'config',
        'deps',
        'animation',
        'utils',
        'api',
        'types'
      ]
    ],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case']
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 72],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 72]
  }
};
```

### Husky Git Hooks

项目配置了 Git hooks 来自动验证提交信息。

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no-install commitlint --edit $1
```

## 📚 实际示例

### 新功能提交

```bash
# 简单新功能
feat(element-sizer): add fade animation option

# 复杂新功能
feat(animation): add advanced transition system

Implement a comprehensive animation system with multiple transition types:
- Fade in/out animations
- Slide transitions
- Scale transformations
- Custom easing functions

The system supports chaining animations and provides callbacks for
animation lifecycle events.

Closes #45
```

### Bug 修复提交

```bash
# 简单修复
fix(element-sizer): resolve memory leak in event listeners

# 复杂修复
fix(animation): prevent race condition in concurrent animations

Fix a race condition that occurred when multiple animations were
triggered simultaneously on the same element. The issue was caused
by shared state between animation instances.

Changes:
- Add animation queue management
- Implement proper cleanup for interrupted animations
- Add tests for concurrent animation scenarios

Fixes #123
Refs #124
```

### 文档更新提交

```bash
# API 文档
docs(api): update ElementResizer constructor options

# README 更新
docs(readme): add installation and usage examples

# 指南文档
docs(guide): add testing best practices section
```

### 重构提交

```bash
# 代码重构
refactor(utils): extract common animation helpers

# 架构重构
refactor(core): migrate to composition-based architecture

Restructure the core module to use composition pattern instead of
inheritance. This change improves testability and makes the code
more modular.

BREAKING CHANGE: The ElementResizer class constructor signature has changed.
Migration: new ElementResizer(element, options) -> new ElementResizer({ target: element, ...options })
```

### 性能优化提交

```bash
# 性能优化
perf(animation): optimize RAF usage for better performance

# 内存优化
perf(element-sizer): reduce memory footprint by 30%

Optimize memory usage by implementing object pooling for frequently
created animation objects and improving garbage collection patterns.

Performance improvements:
- 30% reduction in memory usage
- 15% faster animation initialization
- Better performance on low-end devices
```

### 测试相关提交

```bash
# 添加测试
test(element-sizer): add unit tests for resize detection

# 修复测试
test(animation): fix flaky animation timing tests

# 测试配置
test(setup): configure vitest for browser environment
```

### 构建和配置提交

```bash
# 构建配置
build(rollup): add UMD bundle support

# 依赖更新
chore(deps): update vitest to v1.0.0

# CI/CD 配置
ci(github): add automated release workflow

# 开发工具配置
chore(eslint): add new rules for better code quality
```

## 🎯 最佳实践

### 1. 提交频率

```bash
# ✅ 好的提交频率 - 逻辑完整的小变更
feat(element-sizer): add resize detection
test(element-sizer): add tests for resize detection
docs(element-sizer): update API documentation

# ❌ 不好的提交频率 - 过大的变更
feat(element-sizer): add complete animation system with tests and docs
```

### 2. 原子性提交

```bash
# ✅ 原子性提交 - 一个提交只做一件事
fix(element-sizer): resolve memory leak
refactor(element-sizer): extract animation helpers

# ❌ 非原子性提交 - 一个提交做多件事
fix(element-sizer): resolve memory leak and refactor code
```

### 3. 提交时机

```bash
# ✅ 合适的提交时机
- 完成一个功能点
- 修复一个 bug
- 重构一个模块
- 更新文档

# ❌ 不合适的提交时机
- 代码还有语法错误
- 测试没有通过
- 功能只完成一半
```

### 4. 分支策略配合

```bash
# 功能分支
feature/add-animation-system
├── feat(animation): add basic animation framework
├── feat(animation): add fade transition
├── feat(animation): add slide transition
├── test(animation): add comprehensive test suite
└── docs(animation): add API documentation

# 修复分支
hotfix/memory-leak-fix
├── fix(element-sizer): resolve memory leak in listeners
└── test(element-sizer): add regression test for memory leak
```

## 🚨 常见错误

### 1. 类型选择错误

```bash
# ❌ 错误的类型选择
chore(element-sizer): add new resize feature  # 应该用 feat
fix(docs): update README                      # 应该用 docs
feat(test): add unit tests                    # 应该用 test

# ✅ 正确的类型选择
feat(element-sizer): add new resize feature
docs(readme): update installation guide
test(element-sizer): add unit tests for resize
```

### 2. 作用域使用错误

```bash
# ❌ 错误的作用域
feat(ElementSizer): add feature              # 应该用小写
fix(element_sizer): fix bug                  # 应该用连字符
feat(packages/element-sizer): add feature    # 不需要路径

# ✅ 正确的作用域
feat(element-sizer): add resize feature
fix(element-sizer): resolve animation bug
feat(animation): add transition effects
```

### 3. 描述格式错误

```bash
# ❌ 错误的描述格式
feat(element-sizer): Added new feature.      # 不要过去式和句号
feat(element-sizer): Add New Feature         # 不要首字母大写
feat(element-sizer): add feature and fix bug # 不要在一个提交中做多件事

# ✅ 正确的描述格式
feat(element-sizer): add resize animation
fix(element-sizer): resolve memory leak
docs(element-sizer): update API examples
```

## 🔧 故障排除

### 提交被拒绝

如果提交被 commitlint 拒绝：

```bash
# 查看错误信息
$ git commit -m "Add new feature"
⧗   input: Add new feature
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

# 修正提交信息
$ git commit -m "feat(element-sizer): add new resize feature"
```

### 修改最后一次提交

```bash
# 修改提交信息
git commit --amend -m "feat(element-sizer): add resize animation"

# 添加文件到最后一次提交
git add forgotten-file.ts
git commit --amend --no-edit
```

### 交互式修改历史

```bash
# 修改最近 3 次提交
git rebase -i HEAD~3

# 在编辑器中选择要修改的提交
pick abc1234 feat(element-sizer): add feature
reword def5678 fix bug  # 改为 reword 来修改提交信息
pick ghi9012 docs: update readme
```

## 📖 参考资源

### 官方文档

- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Angular 提交规范](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [语义化版本规范](https://semver.org/)

### 工具文档

- [Commitizen 文档](https://github.com/commitizen/cz-cli)
- [Commitlint 文档](https://commitlint.js.org/)
- [Husky 文档](https://typicode.github.io/husky/)

### 相关链接

- [如何写好 Git 提交信息](https://chris.beams.io/posts/git-commit/)
- [约定式提交最佳实践](https://www.conventionalcommits.org/en/v1.0.0/#examples)

## 📞 支持

如果在使用提交规范时遇到问题：

1. 查看 [项目 Issues](https://github.com/qlover/brain-toolkit/issues)
2. 参考本文档的故障排除部分
3. 联系项目维护者
4. 查看 commitlint 错误信息获取具体指导
