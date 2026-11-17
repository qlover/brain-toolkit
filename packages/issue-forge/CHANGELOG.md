# Changelog

## 0.1.1

### Patch Changes

#### ✨ Features

- **pam:** 截图发布幂等、本地清理与按钮文案 ([63adcd7](https://github.com/qlover/brain-toolkit/commit/63adcd7e4f2f566c951b479a59777e855044c696)) ([#226](https://github.com/qlover/brain-toolkit/pull/226))

  发评前按 Issue 评论查重，避免超时重试重复挂图；成功后落库 GitHub URL 并清理 Supabase。
  Admin 改为「发布截图」，仅本地仍有图时显示；手动发布强制重置 count。

- **issue-forge:** 新增 Issue 网关与 feedback 编排包 ([b94486e](https://github.com/qlover/brain-toolkit/commit/b94486e8c662a9f79f1a5f35e189d9cbefc54ecd)) ([#217](https://github.com/qlover/brain-toolkit/pull/217))

  GitHub App 网关/验签；feedback 子路径提供 Host 端口、模板渲染与同步引擎。

#### 🐞 Bug Fixes

- **issue-forge:** 入口改为 dist，并补充发版相关规则 ([f185cd7](https://github.com/qlover/brain-toolkit/commit/f185cd7b95c0394739308d27d45075695422ab11)) ([#227](https://github.com/qlover/brain-toolkit/pull/227))

  顶层 main/exports 直接指向 dist，publishConfig 仅 access。同步：禁止手改 version/CHANGELOG/changeset；禁止外力绕过、改动须成比例。

- **pam:** 修复反馈截图漏同步并增加 Admin 详情抽屉 ([edb1c96](https://github.com/qlover/brain-toolkit/commit/edb1c966889698560f2cd3d7500903ac580fe2ab)) ([#226](https://github.com/qlover/brain-toolkit/pull/226))

  消除建 Issue 与传截图竞态；评论改用 raw URL；Admin 可补同步截图并点行看详情。

- **issue-forge:** 修复截图同步单测在根 type-check 下的类型错误 ([936ef9c](https://github.com/qlover/brain-toolkit/commit/936ef9cfcb77e194a4e988c285fc6556f7138d01)) ([#226](https://github.com/qlover/brain-toolkit/pull/226))

  根 tsconfig.test 会检查 packages/\*\*/**tests**；避免对 mock.calls 元组做不安全下标断言。

## 0.1.0

- 初版：GitHub App Issue 网关 + `/feedback` 同步编排（建 Issue、截图评论、webhook 关单回写）
